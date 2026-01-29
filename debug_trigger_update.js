
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testTriggerUpdate() {
    console.log(`\n🧪 Testing Trigger UPDATE Logic...`);

    // Use the LEAD created in the previous step (Found in output of previous step)
    // ID: f3ec4a02-6704-4216-959f-4607bb18c5a5
    const LEAD_ID = 'f3ec4a02-6704-4216-959f-4607bb18c5a5';

    // Check if lead exists (in case user deleted it, though I didn't)
    const { data: lead } = await supabase.from('leads').select('id').eq('id', LEAD_ID).single();
    if (!lead) {
        console.log("Debug lead not found, creating new one for update test.");
        // Create logic if needed, but likely it exists.
        return;
    }


    // Get schedule
    const { data: schedules, error: schedError } = await supabase.from('call_schedules').select('*').eq('lead_id', LEAD_ID);

    if (!schedules || schedules.length === 0) {
        console.error("❌ No schedules found for lead:", LEAD_ID);
        console.error("Error if any:", schedError);
        return;
    }

    const schedule = schedules[0];
    console.log(`Found Schedule: ${schedule.id} (Next: ${schedule.next_attempt_at})`);

    // Target Time
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() + 100);
    const targetTimeIso = targetTime.toISOString();

    console.log(`Updating Schedule to: ${targetTimeIso}`);

    await supabase
        .from('call_schedules')
        .update({ next_attempt_at: targetTimeIso })
        .eq('id', schedule.id);

    await new Promise(r => setTimeout(r, 2000));

    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .eq('status', 'PENDING');

    console.log("Jobs after update:", jobs);

    const matched = jobs.find(j => new Date(j.scheduled_at).getTime() === new Date(targetTimeIso).getTime());
    if (matched) {
        console.log("✅ SUCCESS: Found a job updated to the new time.");
    } else {
        console.error("❌ FAILURE: No job matches the new time.");
    }

    // Cleanup
    console.log("Cleaning up...");
    await supabase.from('leads').delete().eq('id', LEAD_ID);
}

testTriggerUpdate();
