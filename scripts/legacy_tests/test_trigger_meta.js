
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

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("❌ Need SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testTriggerMeta() {
    const testPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const testName = `Meta Trigger Test ${new Date().getTime()}`;

    console.log(`\n🧪 Inserting Test Lead (Source=Meta): ${testName}`);

    const { data: lead, error } = await supabase
        .from('leads')
        .insert({
            full_name: testName,
            phone: testPhone,
            email: 'meta_test@example.com',
            source: 'meta', // Testing this specific source
            state: 'Illinois',
            marketing_consent: true,
            terms_accepted: true
        })
        .select()
        .single();

    if (error) {
        console.error('❌ Insert failed:', error);
        return;
    }

    console.log(`✅ Lead inserted details: ID ${lead.id}`);
    console.log('⏳ Waiting 10 seconds...');

    await new Promise(r => setTimeout(r, 10000));

    // Check Events
    const { data: events } = await supabase
        .from('lead_events')
        .select('*')
        .eq('lead_id', lead.id);

    // Check Jobs
    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', lead.id);

    console.log('\n📊 Results for Source=Meta:');
    console.log(`   - Lead Events Found: ${events?.length || 0}`);
    console.log(`   - Jobs Found: ${jobs?.length || 0}`);

    if ((events?.length || 0) === 0 && (jobs?.length || 0) === 0) {
        console.error('❌ CONCLUSION: Trigger IGNORED source="meta".');
    } else {
        console.log('✅ CONCLUSION: Trigger fired for source="meta".');
    }
}

testTriggerMeta();
