import fetch from 'node-fetch';

const BASE_URL = process.env.SUPABASE_FUNCTIONS_BASE_URL;

if (!BASE_URL) {
    throw new Error('Missing SUPABASE_FUNCTIONS_BASE_URL. Example: https://<project-ref>.supabase.co/functions/v1');
}

async function testKillSwitch() {
    console.log('--- Testing Kill Switch ---');
    console.log('Verifying that make_outbound_call is disabled by configuration.\n');

    const url = `${BASE_URL}/make_outbound_call_test`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Does check for service role key? The function code checks internal env vars?
                // Shared utils checks env vars.
                // make_outbound_call checks if !COMMUNICATIONS_ENABLED immediately.
                // It doesn't check Authorization header until later (wait, verifyjwt=false in deployment).
                // Let's see the code again.
            },
            body: JSON.stringify({ lead_id: 'test' })
        });

        const status = response.status;
        const data = await response.json();

        if (data.call_id === 'DISABLED_BY_CONFIG') {
            console.log('✅ Kill Switch Active: function returned DISABLED_BY_CONFIG');
        } else {
            console.error('❌ Kill Switch FAILED: function returned', data);
        }

    } catch (error) {
        console.error('API Error:', error.message);
    }
}

testKillSwitch();
