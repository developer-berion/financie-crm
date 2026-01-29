
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

const leadId = '83fd0162-249b-4655-a85d-324732d2e915';
const nextAttempt = '2026-01-28T15:00:00Z'; // 9 AM CST is 3 PM UTC

async function reschedule() {
    console.log(`Checking current schedule for lead ${leadId}...`);

    const { data: existing, error: findError } = await supabase
        .from('call_schedules')
        .select('*')
        .eq('lead_id', leadId)
        .single();

    if (findError) {
        console.error('Error finding schedule:', findError);
        return;
    }

    console.log(`Updating schedule ID ${existing.id} to ${nextAttempt} (9 AM Central)...`);

    const { data: schedule, error: schError } = await supabase
        .from('call_schedules')
        .update({
            next_attempt_at: nextAttempt,
            active: true,
            attempts_today: 0
        })
        .eq('id', existing.id)
        .select();

    if (schError) {
        console.error('Error updating schedule:', schError);
        return;
    }
    console.log('Schedule updated:', JSON.stringify(schedule, null, 2));

    // Wait a bit for trigger
    await new Promise(r => setTimeout(r, 2000));

    const { data: jobs, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', leadId)
        .eq('status', 'PENDING');

    if (jobError) {
        console.error('Error fetching jobs:', jobError);
    } else {
        console.log('Current PENDING jobs:', JSON.stringify(jobs, null, 2));
    }
}

reschedule();
