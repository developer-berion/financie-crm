
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cnkwnynujtyfslafsmug.supabase.co';
const ANON_KEY = 'sb_publishable_SKKb9KgN3-cx8irSI_vbcg_UZItVftC';
const leadId = '868c5018-ea95-4b9d-b7f7-c60f4ad7347b';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function checkLead() {
    console.log(`--- Investigating Lead: ${leadId} ---`);

    const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

    if (leadErr) {
        console.error('Lead Error:', leadErr);
    } else {
        console.log('Lead Details:', JSON.stringify(lead, null, 2));
    }

    console.log('\n--- Checking Lead Events ---');
    const { data: events, error: eventErr } = await supabase
        .from('lead_events')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

    if (eventErr) {
        console.error('Events Error:', eventErr);
    } else {
        events.forEach(e => console.log(`[${e.created_at}] ${e.event_type}: ${JSON.stringify(e.payload)}`));
    }

    console.log('\n--- Checking Jobs ---');
    const { data: jobs, error: jobErr } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', leadId);

    if (jobErr) {
        console.error('Jobs Error:', jobErr);
    } else {
        jobs.forEach(j => console.log(`Job [${j.type}]: Status=${j.status}, Scheduled=${j.scheduled_at}, Error=${j.error || 'N/A'}`));
    }
}

checkLead();
