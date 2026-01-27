
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://cnkwnynujtyfslafsmug.supabase.co';
const ANON_KEY = 'sb_publishable_SKKb9KgN3-cx8irSI_vbcg_UZItVftC'; // From .env.local

async function testEndpoint() {
    const url = `${SUPABASE_URL}/functions/v1/orchestrate_lead`;
    console.log(`Testing URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'INSERT',
                table: 'leads',
                record: { id: 'test-verification-id', full_name: 'Test Verify' }
            })
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        try {
            const text = await response.text();
            console.log('Body:', text);
        } catch (e) {
            console.log('Could not read body:', e.message);
        }

    } catch (error) {
        console.error('Network Error:', error.message);
        // Print more details if available
        if (error.cause) console.error('Cause:', error.cause);
    }
}

testEndpoint();
