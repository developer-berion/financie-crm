
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

async function checkSchedule() {
    const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
    console.log(`Total leads in DB: ${count}`);

    const { data: leads } = await supabase.from('leads').select('id, full_name, created_at, last_call_id').order('created_at', { ascending: false }).limit(2);
    if (!leads || leads.length === 0) return console.log('No leads');

    for (const lead of leads) {
        console.log(`\n--- Lead: ${lead.full_name} (${lead.id}) Created: ${lead.created_at} ---`);
        console.log(`   Last Call ID: ${lead.last_call_id}`);

        const { data: schedules } = await supabase.from('call_schedules').select('*').eq('lead_id', lead.id);
        console.log('Schedules:', JSON.stringify(schedules, null, 2));

        const { data: jobs } = await supabase.from('jobs').select('*').eq('lead_id', lead.id).order('scheduled_at', { ascending: false });
        console.log('Jobs:', JSON.stringify(jobs, null, 2));

        const { data: conversations } = await supabase.from('conversations').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false });
        console.log('Conversations:', JSON.stringify(conversations, null, 2));

        const { data: events } = await supabase.from('lead_events').select('*').eq('lead_id', lead.id).order('created_at', { ascending: false }).limit(5);
        console.log('Recent Events:', JSON.stringify(events, null, 2));
    }
}

checkSchedule();
