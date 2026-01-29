
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

if (!SERVICE_KEY || !SUPABASE_URL) {
    console.error("❌ Need SUPABASE_SERVICE_ROLE_KEY and VITE_SUPABASE_URL.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);


async function checkRecentLeads() {
    console.log(`\n🔍 Fetching 5 most recent leads...`);

    const { data: leads, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (leadError) {
        console.error('❌ Error fetching leads:', leadError);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('⚠️ No leads found in the database.');
        return;
    }

    for (const lead of leads) {
        console.log(`\n--------------------------------`);
        console.log(`✅ Lead: ${lead.full_name} (${lead.id})`);
        console.log(`   Phone: ${lead.phone}`);
        console.log(`   Status: ${lead.status}`);
        console.log(`   Created At: ${lead.created_at}`);

        const { data: jobs, error: jobError } = await supabase
            .from('jobs')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: false });

        if (jobError) {
            console.error('   ❌ Error fetching jobs:', jobError);
            continue;
        }


        if (!jobs || jobs.length === 0) {
            console.log('   ⚠️ No jobs found.');
        } else {
            console.log(`   📄 Jobs (${jobs.length}):`);
            jobs.forEach(j => {
                console.log(`     - ID: ${j.id}`);
                console.log(`       Type: ${j.type}`);
                console.log(`       Status: ${j.status}`);
                console.log(`       Scheduled At: ${j.scheduled_at}`);
                console.log(`       Execution Message: ${j.execution_message || 'N/A'}`);
            });
        }

    }
}

checkRecentLeads();

