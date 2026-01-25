
const stateToTimezone = {
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

const fullStateToAbbr = {
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

function getSafeCallTime(stateStr) {
    const now = new Date();
    const fallback = new Date(now.getTime() + 2 * 60 * 1000);

    if (!stateStr) return fallback;

    const normalized = stateStr.trim().toLowerCase();
    const abbr = fullStateToAbbr[normalized] || normalized.toUpperCase();
    const timezone = stateToTimezone[abbr];

    if (!timezone) {
        console.log(`Unverifiable state: ${stateStr}, falling back to immediate.`);
        return fallback;
    }

    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: timezone,
            year: 'numeric', month: 'numeric', day: 'numeric',
            hour: 'numeric', minute: 'numeric', second: 'numeric',
            hour12: false
        });

        const nowParts = formatter.formatToParts(now);
        const map = Object.fromEntries(nowParts.map(p => [p.type, p.value]));
        const localHour = parseInt(map.hour);

        console.log(`Lead in ${abbr} (${timezone}). Local hour: ${localHour}`);

        // Safe window: 9 AM - 8 PM
        if (localHour >= 9 && localHour < 20) {
            return fallback;
        }

        // We need to find the UTC time that corresponds to 9:00:00 AM on the current/next day in the target timezone
        let targetLocal = new Date(formatter.format(now));
        if (localHour >= 20) {
            targetLocal.setDate(targetLocal.getDate() + 1);
        }
        targetLocal.setHours(9, 0, 0, 0);

        // Convert targetLocal (which is wall clock) back to UTC
        // The offset is the difference between wall clock and UTC at that moment
        const wallStr = targetLocal.toLocaleString('en-US', { timeZone: timezone, hour12: false });
        const wallDate = new Date(wallStr);
        const offset = wallDate.getTime() - targetLocal.getTime();

        return new Date(targetLocal.getTime() - offset);
    } catch (e) {
        console.error('Error calculating TZ:', e);
        return fallback;
    }
}

// Verification
const zones = ['CA', 'FL', 'NY', 'TX'];
zones.forEach(z => {
    const time = getSafeCallTime(z);
    console.log(`Result for ${z}: ${time.toISOString()} (Local: ${time.toLocaleString('en-US', { timeZone: stateToTimezone[z] })})`);
});
