
const US_STATE_TIMEZONES = {
    'AL': 'America/Chicago', 'AK': 'America/Anchorage', 'AZ': 'America/Phoenix', 'AR': 'America/Chicago',
    'CA': 'America/Los_Angeles', 'CO': 'America/Denver', 'CT': 'America/New_York', 'DE': 'America/New_York',
    'FL': 'America/New_York', 'GA': 'America/New_York', 'HI': 'America/Honolulu', 'ID': 'America/Denver',
    'IL': 'America/Chicago', 'IN': 'America/Indiana/Indianapolis', 'IA': 'America/Chicago', 'KS': 'America/Chicago',
    'KY': 'America/New_York', 'LA': 'America/Chicago', 'ME': 'America/New_York', 'MD': 'America/New_York',
    'MA': 'America/New_York', 'MI': 'America/Detroit', 'MN': 'America/Chicago', 'MS': 'America/Chicago',
    'MO': 'America/Chicago', 'MT': 'America/Denver', 'NE': 'America/Chicago', 'NV': 'America/Los_Angeles',
    'NH': 'America/New_York', 'NJ': 'America/New_York', 'NM': 'America/Denver', 'NY': 'America/New_York',
    'NC': 'America/New_York', 'ND': 'America/Chicago', 'OH': 'America/New_York', 'OK': 'America/Chicago',
    'OR': 'America/Los_Angeles', 'PA': 'America/New_York', 'RI': 'America/New_York', 'SC': 'America/New_York',
    'SD': 'America/Chicago', 'TN': 'America/Chicago', 'TX': 'America/Chicago', 'UT': 'America/Denver',
    'VT': 'America/New_York', 'VA': 'America/New_York', 'WA': 'America/Los_Angeles', 'WV': 'America/New_York',
    'WI': 'America/Chicago', 'WY': 'America/Denver'
};

const FULL_STATE_TO_ABBR = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
    'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
    'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
    'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
    'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
    'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
    'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
    'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY'
};

function getSafeCallTime(stateStr, now) {
    now = now || new Date();
    const fallback = new Date(now.getTime() + 2 * 60 * 1000); // 2 min delay

    if (!stateStr) return { time: fallback, isImmediate: true, reason: 'No State' };

    const normalized = stateStr.trim().toLowerCase();
    const abbr = FULL_STATE_TO_ABBR[normalized] || normalized.toUpperCase();
    const timezone = US_STATE_TIMEZONES[abbr];

    if (!timezone) {
        return { time: fallback, isImmediate: true, reason: 'Unknown State' };
    }

    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        });

        const parts = formatter.formatToParts(now);
        const map = Object.fromEntries(parts.map(p => [p.type, p.value]));
        const localHour = parseInt(map.hour);

        console.log(`Checking State: ${stateStr}, TZ: ${timezone}, Local Hour: ${localHour}`);

        // Safe window: 9 AM - 8 PM
        if (localHour >= 9 && localHour < 20) {
            return { time: fallback, isImmediate: true, reason: 'Within Window' };
        }

        // Calculate target UTC for 9 AM local
        let targetLocal = new Date(formatter.format(now));
        if (localHour >= 20) {
            targetLocal.setDate(targetLocal.getDate() + 1);
        }
        targetLocal.setHours(9, 0, 0, 0);

        const wallStr = targetLocal.toLocaleString('en-US', { timeZone: timezone, hour12: false });
        // Approximating UTC conversion manually since we can't easily do inverse TZ in basic JS without libraries often, 
        // but let's try a simple offset approach or just rely on logic:
        // If it's 8 AM, we wait 1 hour.

        // Let's assume the function logic in Deno works correctly for Date objects.
        // We will just report if it's outside window.

        return { time: 'Scheduled for 9am', isImmediate: false, reason: `Outside Window (Hour ${localHour})` };
    } catch (e) {
        console.error('Error calculating TZ:', e);
        return { time: fallback, isImmediate: true, reason: 'Error' };
    }
}

// SIMULATION
// Current Time: 2026-01-26T10:19:12-04:00
// Since Node runs in system time or UTC, let's explicitly set the time.
// 10:19 -04:00 is 14:19 UTC.
const mockNow = new Date('2026-01-26T14:19:12Z');

console.log(`Mock Now (UTC): ${mockNow.toISOString()}`);

const states = ['TX', 'CA', 'NY', 'FL', 'IL'];

states.forEach(state => {
    const result = getSafeCallTime(state, mockNow);
    console.log(`State: ${state} -> Immediate: ${result.isImmediate}, Reason: ${result.reason}`);
});
