
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

async function checkEverything() {
    console.log(`\n--- Comprehensive Schedule Check ---`);

    // 1. Check jobs table for 'scheduled'
    const { data: scheduledJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*, leads(full_name)')
        .eq('status', 'scheduled');

    console.log(`\n1. Jobs with status 'scheduled': ${scheduledJobs?.length || 0}`);
    if (scheduledJobs?.length > 0) {
        scheduledJobs.forEach(j => console.log(`   - Lead: ${j.leads?.full_name}, Type: ${j.type}, At: ${j.scheduled_at}`));
    }

    // 2. Check conversation_results for future appointments
    const { data: futureAppts, error: apptError } = await supabase
        .from('conversation_results')
        .select('*, leads(full_name)')
        .gt('scheduled_datetime', new Date().toISOString());

    console.log(`\n2. Future appointments in conversation_results: ${futureAppts?.length || 0}`);
    if (futureAppts?.length > 0) {
        futureAppts.forEach(a => console.log(`   - Lead: ${a.leads?.full_name}, At: ${a.scheduled_datetime}`));
    }

    // 3. Check for leads in a 'Scheduled' status
    const { data: statusLeads, error: statusError } = await supabase
        .from('leads')
        .select('full_name, status')
        .in('status', ['Agendado', 'Scheduled', 'Cita Programada', 'agendado', 'scheduled']);

    console.log(`\n3. Leads with a 'Scheduled' status: ${statusLeads?.length || 0}`);
    if (statusLeads?.length > 0) {
        statusLeads.forEach(l => console.log(`   - Lead: ${l.full_name}, Status: ${l.status}`));
    }

    // 4. Latest lead details as reference
    const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, full_name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (recentLeads?.length > 0) {
        console.log(`\n4. Most Recent Lead Reference:`);
        console.log(`   - Name: ${recentLeads[0].full_name}`);
        console.log(`   - Status: ${recentLeads[0].status}`);
        console.log(`   - Created At: ${recentLeads[0].created_at}`);
    }
}

checkEverything();
