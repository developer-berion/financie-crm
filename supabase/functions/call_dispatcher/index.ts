import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders, getSupabaseClient } from "../shared-utils.ts";

serve(async (req) => {
    // Defines standard retry windows (Hour-based 24h)
    const validHours = [9, 13, 19]; 
    const tzOffset = -4; 
    const now = new Date();
    const localNow = new Date(now.getTime() + (tzOffset * 60 * 60 * 1000)); 
    const currentHour = localNow.getUTCHours();
    
    console.log(`Dispatcher Run. Local Hour: ${currentHour}`);

    const supabase = getSupabaseClient();
    
    const { data: schedules, error } = await supabase
        .from('call_schedules')
        .select('id, lead_id, attempts_today, retry_count_block, lead_id(id, phone, full_name, do_not_call)')
        .eq('active', true)
        .lte('next_attempt_at', now.toISOString())
        .limit(10);

    if (error) {
        return new Response(JSON.stringify(error), { status: 500 });
    }

    if (!schedules || schedules.length === 0) {
        return new Response(JSON.stringify({ message: 'No actions due' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results = [];
    const isInWindow = validHours.includes(currentHour);

    for (const item of schedules) {
        //@ts-ignore join
        const lead = item.lead_id;
        
        if (lead.do_not_call) {
             await supabase.from('call_schedules').update({ active: false }).eq('id', item.id);
             results.push({ id: item.id, status: 'skipped_dnc' });
             continue;
        }

        // Check if lead already answered (Stop condition)
        const { data: answerEvent } = await supabase
            .from('lead_events')
            .select('id')
            .eq('lead_id', lead.id)
            .in('event_type', ['call.answered', 'call.completed'])
            .limit(1);

        if (answerEvent && answerEvent.length > 0) {
            await supabase.from('call_schedules').update({ active: false }).eq('id', item.id);
            results.push({ id: item.id, status: 'stopped_answered' });
            continue;
        }

        if (!isInWindow) {
            // Find next block hour
            let nextBlockHour = validHours.find(h => h > currentHour);
            let nextAttempt: Date;

            if (nextBlockHour) {
                const nextD = new Date(localNow);
                nextD.setUTCHours(nextBlockHour, 0, 0, 0);
                nextAttempt = new Date(nextD.getTime() - (tzOffset * 60 * 60 * 1000));
            } else {
                // Tomorrow 9 AM
                const tomorrow = new Date(localNow);
                tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                tomorrow.setUTCHours(9, 0, 0, 0);
                nextAttempt = new Date(tomorrow.getTime() - (tzOffset * 60 * 60 * 1000));
            }

            await supabase.from('call_schedules').update({ 
                next_attempt_at: nextAttempt.toISOString(),
                retry_count_block: 0 // Reset block retries when moving to a new window
            }).eq('id', item.id);

            results.push({ id: item.id, status: 'rescheduled_for_window', next_attempt: nextAttempt.toISOString() });
            continue;
        }

        // EXECUTE CALL (ElevenLabs)
        const { triggerCall } = await import("../shared-utils.ts");
        const callResult = await triggerCall(lead.id);

        // Update Schedule
        let nextAttempt: Date;
        let nextBlockRetry = item.retry_count_block + 1;
        let nextTotalToday = item.attempts_today + 1;

        if (nextBlockRetry < 3) {
            // Retry in 5 minutes within same block
            nextAttempt = new Date(now.getTime() + (5 * 60 * 1000));
        } else {
            // Block finished (3 attempts made)
            nextBlockRetry = 0; 
            
            // Find next block hour
            let nextBlockHour = validHours.find(h => h > currentHour);
            
            if (nextBlockHour) {
                const nextD = new Date(localNow);
                nextD.setUTCHours(nextBlockHour, 0, 0, 0);
                nextAttempt = new Date(nextD.getTime() - (tzOffset * 60 * 60 * 1000));
            } else {
                // Tomorrow 9 AM
                const tomorrow = new Date(localNow);
                tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
                tomorrow.setUTCHours(9, 0, 0, 0);
                nextAttempt = new Date(tomorrow.getTime() - (tzOffset * 60 * 60 * 1000));
                nextTotalToday = 0; // Reset daily count
            }
        }

        await supabase.from('call_schedules').update({
            last_attempt_at: now.toISOString(),
            attempts_today: nextTotalToday,
            retry_count_block: nextBlockRetry,
            next_attempt_at: nextAttempt.toISOString()
        }).eq('id', item.id);

        results.push({ id: item.id, status: 'call_triggered', next_attempt: nextAttempt.toISOString() });
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
