const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cnkwnynujtyfslafsmug.supabase.co';
const supabaseAnonKey = 'sb_publishable_SKKb9KgN3-cx8irSI_vbcg_UZItVftC';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('Querying leads...');
    const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Latest lead:', data);
    }
}

check();
