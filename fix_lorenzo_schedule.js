
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

const LEAD_ID = '83fd0162-249b-4655-a85d-324732d2e915'; // Lorenzo Garcia

// Target: 27 Jan 2026, 7:00 PM Illinois Time
// Illinois is Central Time.
// In Jan (Winter), it is CST (UTC-6).
// 19:00 CST = 01:00 UTC (Next Day)
// So: 2026-01-28T01:00:00Z

const TARGET_TIME_ISO = '2026-01-28T01:00:00.000Z';

async function fixScheduleAndJob() {
    console.log(`\n🛠️ Fixing Schedule and Job for Lorenzo Garcia...`);
    console.log(`Target Time (UTC): ${TARGET_TIME_ISO}`);
    console.log(`Target Time (Illinois/CST): 2026-01-27 19:00:00`);

    // 1. Update call_schedules
    console.log(`\n1. Updating call_schedules...`);
    const { data: schedule, error: schedError } = await supabase
        .from('call_schedules')

        .update({
            next_attempt_at: TARGET_TIME_ISO,
            active: true
        })

        .eq('lead_id', LEAD_ID)
        .select()
        .single();

    if (schedError) {
        console.error('❌ Error updating schedule:', schedError);
        return;
    }
    console.log(`✅ Schedule updated. ID: ${schedule.id}`);

    // 2. Create/Update Job (Simulating the Trigger Logic manually)
    console.log(`\n2. Syncing 'jobs' table...`);

    // Check for existing pending job
    const { data: existingJobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .eq('status', 'PENDING')
        .eq('type', 'INITIAL_CALL');

    if (existingJobs && existingJobs.length > 0) {
        const job = existingJobs[0];
        console.log(`   Found existing PENDING job (ID: ${job.id}). Updating...`);
        const { error: updateError } = await supabase
            .from('jobs')
            .update({ scheduled_at: TARGET_TIME_ISO })
            .eq('id', job.id);

        if (updateError) console.error('   ❌ Error updating job:', updateError);
        else console.log('   ✅ Job updated.');

    } else {
        console.log(`   No pending job found. Creating new one...`);
        const { data: newJob, error: insertError } = await supabase
            .from('jobs')
            .insert({
                lead_id: LEAD_ID,
                type: 'INITIAL_CALL',
                status: 'PENDING',
                scheduled_at: TARGET_TIME_ISO
            })
            .select()
            .single();

        if (insertError) console.error('   ❌ Error creating job:', insertError);
        else console.log(`   ✅ Job created. ID: ${newJob.id}`);
    }

    console.log(`\n🎉 Fix Complete. Verify in UI.`);
}

fixScheduleAndJob();
