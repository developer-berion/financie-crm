
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

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("❌ Need SUPABASE_SERVICE_ROLE_KEY to check jobs.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const LEAD_ID = '83fd0162-249b-4655-a85d-324732d2e915';

async function checkJobs() {
    console.log(`\n🔍 Checking Jobs for Lead: ${LEAD_ID}`);

    const { data: jobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Error fetching jobs:', error);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log('⚠️ No jobs found for this lead.');
        console.log('Posible Causes:');
        console.log('1. DB Trigger to Orchestrate Lead did not fire.');
        console.log('2. Orchestration failed silently (check Edge Function logs).');
        console.log('3. Lead was inserted without triggering the workflow.');
    } else {
        console.log(`📄 Found ${jobs.length} jobs:`);
        jobs.forEach(j => {
            console.log(`   - ID: ${j.id}`);
            console.log(`     Type: ${j.type}`);
            console.log(`     Status: ${j.status}`);
            console.log(`     Scheduled At: ${j.scheduled_at}`);
            console.log(`     Message: ${j.execution_message || 'N/A'}`);
            console.log('---');
        });
    }
}

checkJobs();
