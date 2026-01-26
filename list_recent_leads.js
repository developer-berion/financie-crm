
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cnkwnynujtyfslafsmug.supabase.co';
const ANON_KEY = 'sb_publishable_SKKb9KgN3-cx8irSI_vbcg_UZItVftC';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function listLeads() {
    console.log(`--- Listing Recent Leads ---`);

    const { data: leads, error } = await supabase
        .from('leads')
        .select('id, full_name, phone, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error:', error);
    } else {
        console.table(leads);
    }
}

listLeads();
