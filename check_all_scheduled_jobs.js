
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

async function checkScheduledJobs() {
    console.log(`\n🔍 Checking for ANY scheduled jobs...`);

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*, leads(full_name, phone)')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

    if (error) {
        console.error('❌ Error fetching scheduled jobs:', error);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log('✅ No scheduled jobs found in the database.');
    } else {
        console.log(`📄 Found ${jobs.length} scheduled jobs:`);
        jobs.forEach(j => {
            console.log(`   - Lead: ${j.leads?.full_name} (${j.lead_id})`);
            console.log(`     Type: ${j.type}`);
            console.log(`     Status: ${j.status}`);
            console.log(`     Scheduled At: ${j.scheduled_at}`);
            console.log('---');
        });
    }
}

checkScheduledJobs();
