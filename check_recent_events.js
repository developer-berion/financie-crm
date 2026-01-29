
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

async function checkRecentEvents() {
    console.log(`\n🔍 Checking for 10 most recent lead events...`);

    const { data: events, error } = await supabase
        .from('lead_events')
        .select('*, leads(full_name)')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error fetching lead events:', error);
        return;
    }

    if (!events || events.length === 0) {
        console.log('⚠️ No lead events found.');
    } else {
        console.log(`📄 Found ${events.length} recent events:`);
        events.forEach(e => {
            console.log(`   - Lead: ${e.leads?.full_name} (${e.lead_id})`);
            console.log(`     Event: ${e.event_type}`);
            console.log(`     Created At: ${e.created_at}`);
        });
    }
}

checkRecentEvents();
