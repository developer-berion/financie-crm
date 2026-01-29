
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
const LEAD_ID = '83fd0162-249b-4655-a85d-324732d2e915';

async function verifyFix() {
    console.log(`\n🔍 Verifying Fix for Lorenzo Garcia...`);

    // Check Schedule
    const { data: schedule } = await supabase
        .from('call_schedules')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .single();

    console.log(`\n📅 Call Schedule:`);
    console.log(`   - Time (UTC): ${schedule.next_attempt_at}`);
    console.log(`   - Active: ${schedule.active}`);

    // Check Job
    const { data: job } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .eq('status', 'PENDING')
        .eq('type', 'INITIAL_CALL')
        .single();

    if (job) {
        console.log(`\n👷 Job:`);
        console.log(`   - ID: ${job.id}`);
        console.log(`   - Scheduled At: ${job.scheduled_at}`);
        console.log(`   - Status: ${job.status}`);

        const scheduleTime = new Date(schedule.next_attempt_at).getTime();
        const jobTime = new Date(job.scheduled_at).getTime();

        if (scheduleTime === jobTime) {
            console.log(`\n✅ SUCCESS: Schedule and Job are perfectly synced!`);
        } else {
            console.error(`\n❌ ERROR: Timestamp mismatch!`);
        }
    } else {
        console.error(`\n❌ ERROR: No pending job found!`);
    }
}

verifyFix();
