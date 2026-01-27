
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://cnkwnynujtyfslafsmug.supabase.co';
const ANON_KEY = 'sb_publishable_SKKb9KgN3-cx8irSI_vbcg_UZItVftC';

async function testOptions() {
    const url = `${SUPABASE_URL}/functions/v1/orchestrate_lead`;
    console.log(`Testing OPTIONS on: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'OPTIONS',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                // Mimic browser headers slightly
                'Access-Control-Request-Method': 'POST',
                'Origin': 'http://localhost:5173'
            }
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log('Headers:', response.headers.raw());

        if (response.status === 200) {
            const allowOrigin = response.headers.get('access-control-allow-origin');
            if (allowOrigin === '*' || allowOrigin === 'http://localhost:5173') {
                console.log('✅ CORS Origin allows access.');
            } else {
                console.log('❌ CORS Origin header missing or incorrect:', allowOrigin);
            }
        } else {
            console.log('❌ OPTIONS request failed (Function might not handle OPTIONS).');
        }

    } catch (error) {
        console.error('Network Error:', error.message);
    }
}

testOptions();
