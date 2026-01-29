const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cnkwnynujtyfslafsmug.supabase.co';
const supabaseKey = 'sb_secret_9-JFDlGF1DM7wxS7z5BpuA_sUjCS-1J';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    console.log("--- Debug Dispatcher Logic (Per-Lead) ---");

    // Simulate Logic
    const validHours = [9, 12, 19];
    const now = new Date();

    const US_STATE_TIMEZONES = {
        'AL': 'America/Chicago', 'AK': 'America/Anchorage', 'AZ': 'America/Phoenix', 'AR': 'America/Chicago',
        'CA': 'America/Los_Angeles', 'CO': 'America/Denver', 'CT': 'America/New_York', 'DE': 'America/New_York',
        'FL': 'America/New_York', 'GA': 'America/New_York', 'HI': 'America/Honolulu', 'ID': 'America/Denver',
        'IL': 'America/Chicago', 'IN': 'America/Indiana/Indianapolis', 'IA': 'America/Chicago',
        'KS': 'America/Chicago', 'KY': 'America/New_York', 'LA': 'America/Chicago', 'ME': 'America/New_York',
        'MD': 'America/New_York', 'MA': 'America/New_York', 'MI': 'America/Detroit', 'MN': 'America/Chicago',
        'MS': 'America/Chicago', 'MO': 'America/Chicago', 'MT': 'America/Denver', 'NE': 'America/Chicago',
        'NV': 'America/Los_Angeles', 'NH': 'America/New_York', 'NJ': 'America/New_York', 'NM': 'America/Denver',
        'NY': 'America/New_York', 'NC': 'America/New_York', 'ND': 'America/Chicago', 'OH': 'America/New_York',
        'OK': 'America/Chicago', 'OR': 'America/Los_Angeles', 'PA': 'America/New_York', 'RI': 'America/New_York',
        'SC': 'America/New_York', 'SD': 'America/Chicago', 'TN': 'America/Chicago', 'TX': 'America/Chicago',
        'UT': 'America/Denver', 'VT': 'America/New_York', 'VA': 'America/New_York', 'WA': 'America/Los_Angeles',
        'DC': 'America/New_York', 'WV': 'America/New_York', 'WI': 'America/Chicago', 'WY': 'America/Denver'
    };

    const FULL_STATE_TO_ABBR = {
        'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
        'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
        'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
        'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
        'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
        'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH',
        'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC',
        'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA',
        'rhode island': 'RI', 'south carolina': 'SC', 'south dakota': 'SD', 'tennessee': 'TN',
        'texas': 'TX', 'utah': 'UT', 'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA',
        'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
    };

    function getLeadTimezone(stateStr) {
        if (!stateStr) return 'America/New_York';
        const normalized = stateStr.trim().toLowerCase();
        const abbr = FULL_STATE_TO_ABBR[normalized] || normalized.toUpperCase();
        return US_STATE_TIMEZONES[abbr] || 'America/New_York';
    }

    function getLeadHour(date, timeZone) {
        const fmt = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone
        });
        const hourStr = fmt.format(date);
        return parseInt(hourStr, 10) % 24;
    }

    console.log(`Now (UTC): ${now.toISOString()}`);

    // FETCH SCHEDULES WITH LEAD STATE
    const { data: schedules, error } = await supabase
        .from('call_schedules')
        .select('id, lead_id, attempts_today, retry_count_block, next_attempt_at, active, lead_id(id, phone, full_name, do_not_call, state)')
        .eq('active', true)
        // .lte('next_attempt_at', now.toISOString()) // Allow seeing future ones for debug
        .limit(10);

    if (error) {
        console.error("Query Error:", error);
        return;
    }

    console.log(`Schedules found: ${schedules.length}`);

    for (const s of schedules) {
        if (!s.lead_id) continue;
        const lead = s.lead_id;

        // Simulate Stop Check
        const { data: events } = await supabase.from('lead_events')
            .select('id')
            .eq('lead_id', lead.id)
            .in('event_type', ['call.answered', 'call.completed', 'conversation.completed'])
            .limit(1);

        if (events && events.length > 0) {
            console.log(`[SKIP] Lead ${lead.full_name} has already answered.`);
            continue;
        }

        const tz = getLeadTimezone(lead.state);
        const localHour = getLeadHour(now, tz);

        console.log(`\n--- Processing ${lead.full_name} ---`);
        console.log(`State: ${lead.state} -> TZ: ${tz}`);
        console.log(`Local Hour: ${localHour}`);

        const isInWindow = validHours.includes(localHour);
        console.log(`In Window [9, 12, 19]? ${isInWindow}`);

        if (!isInWindow) {
            let nextBlockHour = validHours.find(h => h > localHour);
            console.log(`Next Block Hour: ${nextBlockHour || 'Tomorrow 9'}`);

            // Calc logic same as backend
            let nextAttemptDate;
            if (nextBlockHour) {
                // Approximate logic: bump hours
                const diff = nextBlockHour - localHour;
                const t = new Date(now.getTime());
                t.setHours(t.getHours() + diff);
                t.setMinutes(0, 0, 0);

                // Double check calculation with Intl
                const checkHour = getLeadHour(t, tz);
                console.log(`Target Hour Local: ${checkHour} (Should be ${nextBlockHour})`);
                console.log(`Diff: +${diff} hours`);

                nextAttemptDate = t;
            } else {
                console.log("Tomorrow logic...");
                // (Simplified for debug output only)
            }

            if (nextAttemptDate) {
                console.log(`Calculated Next Attempt (UTC): ${nextAttemptDate.toISOString()}`);
            }
        }
    }
}

run();
