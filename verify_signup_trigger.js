
import { createClient } from '@supabase/supabase-js';

// Load env vars if possible, or use defaults from shared utils
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY environment variable is required to run this script safely.');
    console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=... node verify_signup_trigger.js');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyTrigger() {
    console.log('--- Verifying Signup Context Trigger ---');

    const testLeads = [
        { full_name: 'Test JS CA', phone: '+19998887771', state: 'CA' },
        { full_name: 'Test JS FL', phone: '+19998887772', state: 'FL' }
    ];

    for (const lead of testLeads) {
        console.log(`Inserting lead from ${lead.state}...`);
        const { data, error } = await supabase.from('leads').insert({
            full_name: lead.full_name,
            phone: lead.phone,
            state: lead.state,
            status: 'Nuevo'
            // Note: We are NOT sending signup_date/time, expecting the DB to fill them
        }).select().single();

        if (error) {
            console.error('Insert Error:', error);
        } else {
            console.log(`Success! ID: ${data.id}`);
            console.log(`  State: ${data.state}`);
            console.log(`  Signup Date: ${data.signup_date}`);
            console.log(`  Signup Time: ${data.signup_time}`);
        }
    }
}

verifyTrigger();
