
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

async function checkTriggerExistence() {
    console.log(`\n🔍 Checking for trigger 'on_schedule_change'...`);

    // We can't query information_schema directly with supabase-js easily unless we rely on a view or rpc.
    // However, if we can run SQL, we would be golden. We know we can't.
    // But we can check if the function 'sync_jobs_from_schedule' exists?
    // Not easily.

    // Alternative: Try to verify if the logic works by manual inspection of a test record 
    // WITHOUT deleting it immediately, so I can inspect it.

    console.log("No direct way to query information_schema via standard API.");
    console.log("Creating a persistent test record to debug...");

    const uniqueId = `debug_${Date.now()}`;

    // 1. Create Lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert({
            full_name: 'Debug Trigger User',
            phone: '+15559998888',
            status: 'TEST'
        })
        .select()
        .single();

    if (leadError) {
        console.error("Error creating lead:", leadError);
        return;
    }

    console.log(`Created Debug Lead: ${lead.id}`);

    // 2. Insert Schedule
    const { data: sched, error: schedError } = await supabase
        .from('call_schedules')
        .insert({
            lead_id: lead.id,
            active: true,
            next_attempt_at: new Date().toISOString(),
            attempts_today: 0
        })
        .select()
        .single();

    if (schedError) {
        console.error("Error creating schedule:", schedError);
        return;
    }
    console.log(`Created Schedule: ${sched.id}`);

    console.log("Waiting 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));

    // 3. Check Job
    const { data: jobs, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', lead.id);

    console.log("Jobs found:", jobs);

    // CLEANUP LATER (user can delete 'Debug Trigger User')
}

checkTriggerExistence();
