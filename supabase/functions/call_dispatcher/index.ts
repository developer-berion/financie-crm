import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient, US_STATE_TIMEZONES, FULL_STATE_TO_ABBR } from "../shared-utils.ts";

serve(async (req) => {
    // DISABLED TEMPORARILY: Call dispatcher
    return new Response(JSON.stringify({ 
        message: 'Dispatcher is currently disabled by administrator.' 
    }), { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

    // Defines standard retry windows (Lead Local Time)
    const validHours = [9, 12, 19]; 
    const now = new Date();
    
    // Helper to get Lead's Timezone
    function getLeadTimezone(stateStr?: string): string {
        if (!stateStr) return 'America/New_York';
        const normalized = stateStr.trim().toLowerCase();
        const abbr = FULL_STATE_TO_ABBR[normalized] || normalized.toUpperCase();
        return US_STATE_TIMEZONES[abbr] || 'America/New_York';
    }

    // Helper to get Lead's Current Hour
    function getLeadHour(date: Date, timeZone: string): number {
        const fmt = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone
        });
        const hourStr = fmt.format(date);
        // Handle "24" as "0" if standard changes (though Intl usually 0-23)
        return parseInt(hourStr, 10) % 24;
    }

    console.log(`Dispatcher Run. UTC: ${now.toISOString()}`);

    const supabase = getSupabaseClient();
    
    // Fetch all active schedules due or past due
    const { data: schedules, error } = await supabase
        .from('call_schedules')
        .select('id, lead_id, attempts_today, retry_count_block, active, lead_id(id, phone, full_name, do_not_call, state)')
        .eq('active', true)
        .lte('next_attempt_at', now.toISOString())
        .limit(20); // Process in batches

    console.log(`Querying schedules <= ${now.toISOString()}`);
    console.log(`Schedules found: ${schedules?.length || 0}`);

    if (error) {
        return new Response(JSON.stringify(error), { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
        return new Response(JSON.stringify({ message: 'No actions due' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = [];

    for (const item of schedules) {
        //@ts-ignore join
        const lead = item.lead_id;
        
        // 1. DNC Check
        if (lead.do_not_call) {
             await supabase.from('call_schedules').update({ active: false }).eq('id', item.id);
             // Also cancel pending jobs
             await supabase.from('jobs').update({ status: 'CANCELLED', error: 'DNC' }).eq('lead_id', lead.id).eq('status', 'PENDING');
             results.push({ id: item.id, status: 'skipped_dnc' });
             continue;
        }

        // 2. Stop Condition (Answered)
        const { data: answerEvent } = await supabase
            .from('lead_events')
            .select('id')
            .eq('lead_id', lead.id)
            .in('event_type', ['call.answered', 'call.completed', 'conversation.completed'])
            .limit(1);

        if (answerEvent && answerEvent.length > 0) {
            await supabase.from('call_schedules').update({ active: false }).eq('id', item.id);
            await supabase.from('jobs').update({ status: 'CANCELLED', error: 'Already Answered' }).eq('lead_id', lead.id).eq('status', 'PENDING');
            results.push({ id: item.id, status: 'stopped_answered' });
            continue;
        }

        // 3. Timezone Logic
        const tz = getLeadTimezone(lead.state);
        const currentLocalHour = getLeadHour(now, tz);
        const isInWindow = validHours.includes(currentLocalHour);
        
        console.log(`Lead ${lead.full_name} (${tz}): Local Hour ${currentLocalHour}. In Window? ${isInWindow}`);

        if (!isInWindow) {
            // Find next block hour TODAY
            let nextBlockHour = validHours.find(h => h > currentLocalHour);
            let nextAttemptDate: Date;

            if (nextBlockHour) {
                // Same day, later block
                // Construct date in target timezone
                // We need to find the UTC time that corresponds to "Today, nextBlockHour:00" in Lead's TZ.
                // Approach: Take 'now', format parts in TZ, reconstruct target, get ISO.
                
                // Native JS doesn't support "set timezone", so we use formatting to get "Today's Date in Lead TZ"
                const parts = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    timeZone: tz
                }).formatToParts(now);
                
                const y = parts.find(p => p.type === 'year')?.value;
                const m = parts.find(p => p.type === 'month')?.value;
                const d = parts.find(p => p.type === 'day')?.value;
                
                // Create a string "YYYY-MM-DD HH:00:00" and parse it as if it were in that timezone?
                // Hard to do without external libs. 
                // Alternative: Brute force offset? No.
                
                // Cleanest Deno approach without libs:
                // Construct a string we know represents the target time, then find its UTC equivalent?
                // Actually, let's just guess UTC equivalent and refine? No.
                
                // Robust method:
                // 1. Create a date string "MM/DD/YYYY HH:00:00" in lead's local time.
                // 2. We don't have a parser that accepts string + timezone.
                
                // Let's use specific offsets for US States (hardcoded) to suffice for now? 
                // Or simplified: We know standard offsets.
                // Eastern: -4/-5. Central: -5/-6. Mountain: -6/-7. Pacific: -7/-8.
                // Assuming standard time (Jan = Standard).
                // EST=-5, CST=-6, MST=-7, PST=-8.
                // Let's rely on stored US_STATE_TIMEZONES to map to an offset? 
                // No, better to just bump `next_attempt_at` by (nextBlock - currentHour) hours?
                // Yes, if nextBlock is 19 and current is 14, wait 5 hours.
                // This is safe regardless of timezone!
                // Wait... if current is 14:30. Next is 19:00.
                // We need to reach 19:00:00. 
                // Delta hours = 19 - 14 = 5.
                // Delta minutes = 0 - 30 = -30.
                // Total delta ms.
                
                const targetHour = nextBlockHour;
                const diffHours = targetHour - currentLocalHour; // e.g. 19 - 14 = 5
                
                // Create a Date object cloned from now
                const targetTime = new Date(now.getTime());
                // Add hours
                targetTime.setHours(targetTime.getHours() + diffHours);
                // Zero out minutes/seconds/ms
                targetTime.setMinutes(0, 0, 0); 
                
                nextAttemptDate = targetTime;

            } else {
                // Tomorrow 9 AM
                // Current is > 19 (e.g. 20). Target is 9 (tomorrow).
                // Diff = (24 - 20) + 9 = 13 hours.
                 const targetHour = 9;
                 const hourstilMidnight = 24 - currentLocalHour;
                 const totalHours = hourstilMidnight + targetHour;
                 
                 const targetTime = new Date(now.getTime());
                 targetTime.setHours(targetTime.getHours() + totalHours);
                 targetTime.setMinutes(0,0,0);
                 
                 nextAttemptDate = targetTime;
            }

            // Update Schedule
            await supabase.from('call_schedules').update({ 
                next_attempt_at: nextAttemptDate.toISOString(),
                retry_count_block: 0 
            }).eq('id', item.id);

            // SYNC PENDING JOBS (Critical Fix)
            await supabase.from('jobs').update({
                scheduled_at: nextAttemptDate.toISOString(),
                error: `Rescheduled to ${lead.state} time block`
            }).eq('lead_id', lead.id).eq('status', 'PENDING');

            results.push({ 
                id: item.id, 
                status: 'rescheduled_for_window', 
                lead_tz: tz,
                local_hour: currentLocalHour,
                next_attempt: nextAttemptDate.toISOString() 
            });
            continue;
        }

        // 4. Execute Call (In Window)
        const { triggerCall } = await import("../shared-utils.ts");
        const callResult = await triggerCall(lead.id);

        results.push({ id: item.id, status: 'triggered', result: callResult });

        // Update Retry Logic in Schedule (Same block retry)
        // If we just triggered it, triggerCall creates a job. 
        // We usually rely on `process_jobs` to handle retries? 
        // No, dispatch needs to move `next_attempt` forward so it doesn't loop instantly.
        
        let nextAttempt = new Date(now.getTime() + (5 * 60 * 1000)); // +5 mins
        let nextBlockRetry = item.retry_count_block + 1;

        if (nextBlockRetry >= 3) {
            // Move to next block if retries exhausted
             // (Logic similar to above Out Window, or just bump 4 hours?)
             // Simple: bumped to next hour check loop will catch it.
             // Just set active=true, next_attempt + 1 hour? 
             // Better: Find next block now.
             // ... for now, just fallback to +1 hour, dispatcher will fix it next run.
             nextAttempt = new Date(now.getTime() + (60 * 60 * 1000)); 
             nextBlockRetry = 0; // Reset
        }
        
        await supabase.from('call_schedules').update({
            next_attempt_at: nextAttempt.toISOString(),
            retry_count_block: nextBlockRetry
        }).eq('id', item.id);
    }

    return new Response(JSON.stringify(results), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
})
;
