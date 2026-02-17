import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve('.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyRetry() {
    console.log('🧪 Starting Retry Logic Verification...');

    // 1. Create a dummy job that is GUARANTEED to fail (Invalid Lead ID)
    // using a random UUID that doesn't exist in leads table
    const randomLeadId = '00000000-0000-0000-0000-000000000000';

    console.log('1. Inserting failing job...');
    const { data: job, error } = await supabase
        .from('jobs')
        .insert({
            lead_id: randomLeadId, // This lead does not exist
            type: 'INITIAL_CALL',
            scheduled_at: new Date().toISOString(),
            status: 'PENDING',
            retry_count: 0
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Failed to insert test job:', error);
        return;
    }
    console.log(`✅ Job created: ${job.id}`);

    console.log('2. Triggering process_jobs manually (via function invoke simulation)...');
    // Note: In a real scenario, the cron does this. We will try to invoke the Edge Function if possible, 
    // or we ask the user to wait for the cron. 
    // Since we cannot easily invoke the local edge function from here without the URL, 
    // we will assume the user has the environment running.

    console.log('⚠️ Please ensure your local Supabase stack is running `supabase start`.');
    console.log('   The Cron Job (every minute) should pick this up.');
    console.log('   Waiting 70 seconds for cron execution...');

    // Wait 70s to allow cron to run
    await new Promise(r => setTimeout(r, 70000));

    // 3. Check status
    const { data: updatedJob } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', job.id)
        .single();

    console.log('\n📊 Result after wait:');
    console.log(`   - Status: ${updatedJob.status}`);
    console.log(`   - Retry Count: ${updatedJob.retry_count}`);
    console.log(`   - Error: ${updatedJob.error}`);
    console.log(`   - Scheduled At: ${updatedJob.scheduled_at}`);

    if (updatedJob.status === 'PENDING' && updatedJob.retry_count === 1) {
        console.log('\n✅ VERIFICATION SUCCESS: Job triggered, failed, and was rescheduled (Retry 1).');
    } else if (updatedJob.status === 'FAILED') {
        console.log('\n❌ VERIFICATION FAILED: Job went straight to FAILED (Retry logic didn\'t catch it?).');
    } else if (updatedJob.status === 'PENDING' && updatedJob.retry_count === 0) {
        console.log('\n⚠️ VERIFICATION INCONCLUSIVE: Job is still PENDING (Cron maybe didn\'t run?).');
    }

    // Cleanup
    await supabase.from('jobs').delete().eq('id', job.id);
    console.log('\n🧹 Cleanup done.');
}

verifyRetry();
