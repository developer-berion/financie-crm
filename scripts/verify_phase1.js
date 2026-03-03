import fetch from 'node-fetch';

// Base URL for Supabase Edge Functions
const BASE_URL = process.env.SUPABASE_FUNCTIONS_BASE_URL;

if (!BASE_URL) {
    throw new Error('Missing SUPABASE_FUNCTIONS_BASE_URL. Example: https://<project-ref>.supabase.co/functions/v1');
}

async function testFunction(name, payload, headers, expectedStatus) {
    const url = `${BASE_URL}/${name}`;
    console.log(`Testing ${name}...`);
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
            body: JSON.stringify(payload)
        });

        const status = response.status;
        let text = await response.text();

        // Log status and body for debugging
        if (status === expectedStatus) {
            console.log(`✅ ${name}: SUCCESS (Expected ${expectedStatus}, Got ${status})`);
            return true;
        } else {
            console.error(`❌ ${name}: FAILED (Expected ${expectedStatus}, Got ${status})`);
            console.error(`Response: ${text.substring(0, 100)}...`);
            return false;
        }
    } catch (error) {
        console.error(`❌ ${name}: API Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('--- Phase 1 Security Tests ---');
    console.log('Verifying that unauthorized requests are blocked.\n');

    const results = [];

    // 1. ElevenLabs Webhook Test
    // Expected: 401 Unauthorized (Missing/Invalid Signature)
    results.push(await testFunction(
        'elevenlabs_webhook_test',
        { type: 'post_call_transcription', call_id: 'test_call_123' },
        {},
        401
    ));

    // 2. SMS Webhook Test
    // Expected: 403 Forbidden (Missing/Invalid Twilio Signature)
    results.push(await testFunction(
        'sms_webhook_test',
        { Body: 'Test SMS', From: '+1234567890', To: '+0987654321' },
        { 'x-twilio-signature': 'invalid_sig' },
        403
    ));

    // 3. Call Webhook Test
    // Expected: 403 Forbidden (Missing/Invalid Twilio Signature)
    results.push(await testFunction(
        'call_webhook_test',
        { CallSid: 'CA12345', CallStatus: 'completed' },
        { 'x-twilio-signature': 'invalid_sig' },
        403
    ));

    // 4. Meta Webhook Test
    // Expected: 401 Unauthorized (Missing/Invalid Meta Signature)
    results.push(await testFunction(
        'meta_webhook_test',
        { object: 'page', entry: [] },
        { 'x-hub-signature-256': 'sha256=invalid_sig' },
        401
    ));


    console.log('\n--- Test Summary ---');
    // Using simple filter for booleans
    const passed = results.filter(r => r === true).length;
    console.log(`Passed: ${passed} / ${results.length}`);

    if (passed === results.length) {
        console.log('✅ All security tests PASSED.');
    } else {
        console.log('⚠️ Some tests failed. Check logs above.');
    }
}

runTests();
