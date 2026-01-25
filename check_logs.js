
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cnkwnynujtyfslafsmug.supabase.co';
const ANON_KEY = 'sb_publishable_SKKb9KgN3-cx8irSI_vbcg_UZItVftC';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function check() {
    console.log('--- Checking Latest Lead (ANON) ---');
    const { data: leads, error: leadErr } = await supabase
        .from('leads')
        .select('id, full_name, phone, state, created_at')
        .order('created_at', { ascending: false })
        .limit(1);

    if (leadErr) {
        console.error('Lead error (maybe RLS):', leadErr);
    } else if (leads && leads.length > 0) {
        const lead = leads[0];
        console.log(`Lead: ${lead.full_name} (${lead.id})`);
        console.log(`Phone: ${lead.phone}, State: ${lead.state}, Created: ${lead.created_at}`);

        // Try to check jobs
        console.log('\n--- Checking Job Status (ANON) ---');
        const { data: jobs, error: jobErr } = await supabase
            .from('jobs')
            .select('*')
            .eq('lead_id', lead.id);

        if (jobErr) console.error('Job error (maybe RLS):', jobErr);
        else if (jobs && jobs.length > 0) {
            jobs.forEach(j => console.log(`Job [${j.type}]: Status=${j.status}, Scheduled=${j.scheduled_at}`));
        } else {
            console.log('No jobs found for this lead.');
        }
    } else {
        console.log('No leads found.');
    }
}

check();
