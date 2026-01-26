
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load Env
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
        }
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error('CRITICAL: SERVICE_KEY missing. Expedited update requires Service Role Key.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TEST_LEAD = {
    full_name: 'Bianca Garcia',
    phone: '(786) 436-8033',
    email: 'biancagarcia.finances@gmail.com',
    stable_income: 'Si',
    main_objective: 'Protección',
    health_condition: 'no',
    signup_date: 'sabado 26 de enero',
    signup_time: '11:00 AM',
    state: 'florida',
    marketing_consent: true,
    source: 'test_expedited'
};

async function createLeadExpedited() {
    console.log('--- Creating Expedited Test Lead (1 min delay) ---');

    // 1. Insert Lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([TEST_LEAD])
        .select()
        .single();

    if (leadError) {
        console.error('Error creating lead:', leadError);
        return;
    }

    console.log(`✅ Lead created: ${lead.id}`);

    // 2. Wait a small moment for trigger/async processing
    console.log('Waiting for job creation...');
    await new Promise(r => setTimeout(r, 2000));

    // 3. Force job to 1 minute
    const { data: job, error: jobError } = await supabase
        .from('jobs')
        .update({
            scheduled_at: new Date(Date.now() + 60 * 1000).toISOString()
        })
        .eq('lead_id', lead.id)
        .eq('status', 'PENDING')
        .select();

    if (jobError || !job || job.length === 0) {
        console.warn('Could not update job. Trigger might not have created it yet or failed.');
        console.error(jobError);
    } else {
        console.log('🚀 Job expedited! It will run in approximately 1 minute.');
    }
}

createLeadExpedited();
