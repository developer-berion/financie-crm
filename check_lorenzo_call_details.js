
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

const LEAD_ID = '83fd0162-249b-4655-a85d-324732d2e915'; // Lorenzo Garcia

async function checkCallDetails() {
    console.log(`\n🔍 Checking Call details for Lead: ${LEAD_ID}`);

    const { data: calls, error: callError } = await supabase
        .from('call_events')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .order('created_at', { ascending: false });

    if (callError) {
        console.error('❌ Error fetching call events:', callError);
    } else if (!calls || calls.length === 0) {
        console.log('⚠️ No call events found for this lead.');
    } else {
        console.log(`📄 Found ${calls.length} call events:`);
        calls.forEach(c => {
            console.log(`   - SID: ${c.call_sid}`);
            console.log(`     Status (Raw): ${c.status_raw}`);
            console.log(`     Status (CRM): ${c.status_crm}`);
            console.log(`     Created At: ${c.created_at}`);
        });
    }

    const { data: results, error: resultError } = await supabase
        .from('conversation_results')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .order('created_at', { ascending: false });

    if (resultError) {
        console.error('❌ Error fetching conversation results:', resultError);
    } else if (!results || results.length === 0) {
        console.log('⚠️ No conversation results found for this lead.');
    } else {
        console.log(`📄 Found ${results.length} conversation results:`);
        results.forEach(r => {
            console.log(`   - Conv ID: ${r.conversation_id}`);
            console.log(`     Outcome: ${JSON.stringify(r.outcome)}`);
            console.log(`     Created At: ${r.created_at}`);
        });
    }
}

checkCallDetails();
