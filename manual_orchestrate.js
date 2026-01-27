
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

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
const LEAD_ID = '83fd0162-249b-4655-a85d-324732d2e915';

async function manualOrchestrate() {
    console.log(`\n🔄 Manually Orchestrating Lead: ${LEAD_ID}`);

    // 1. Fetch Lead
    const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', LEAD_ID)
        .single();

    if (error || !lead) {
        console.error('❌ Lead not found:', error);
        return;
    }

    console.log(`✅ Lead Found: ${lead.full_name} (${lead.phone})`);

    // 2. Call Orchestrate Edge Function
    const funcUrl = `${SUPABASE_URL}/functions/v1/orchestrate_lead`;
    console.log(`🚀 Calling: ${funcUrl}`);

    try {
        const response = await fetch(funcUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`, // Service key bypasses RLS and Auth if needed
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'INSERT',
                table: 'leads',
                record: lead
            })
        });

        const result = await response.json();

        if (response.ok) {
            console.log('✅ Orchestration Triggered Successfully!');
            console.log('Response:', result);
            console.log('\n⏳ Check the CRM/Jobs table in a few seconds to verify the scheduled call.');
        } else {
            console.error('❌ Error triggering orchestration:', result);
        }

    } catch (e) {
        console.error('❌ Network Error:', e.message);
    }
}

manualOrchestrate();
