
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

async function checkCallSchedules() {
    console.log(`\n🔍 Checking call_schedules for Lead: ${LEAD_ID}`);

    const { data: schedules, error } = await supabase
        .from('call_schedules')
        .select('*')
        .eq('lead_id', LEAD_ID);

    if (error) {
        console.error('❌ Error fetching call_schedules:', error);
        return;
    }

    if (!schedules || schedules.length === 0) {
        console.log('⚠️ No call schedules found for this lead.');
    } else {
        console.log(`📄 Found ${schedules.length} schedules:`);
        schedules.forEach(s => {
            console.log(`   - ID: ${s.id}`);
            console.log(`     Active: ${s.active}`);
            console.log(`     Next Attempt At: ${s.next_attempt_at}`);
            console.log(`     Attempts Today: ${s.attempts_today}`);
            console.log(`     Created At: ${s.created_at}`);
            console.log('---');
        });
    }
}

checkCallSchedules();
