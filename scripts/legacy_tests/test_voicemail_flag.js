
import https from 'https';

const API_KEY = process.env.ELEVENLABS_API_KEY;
const AGENT_ID = process.env.ELEVENLABS_AGENT_ID;
const PHONE_ID = process.env.ELEVENLABS_PHONE_ID || process.env.ELEVENLABS_PHONE_NUMBER_ID;

if (!API_KEY || !AGENT_ID || !PHONE_ID) {
    throw new Error('Missing ELEVENLABS_API_KEY, ELEVENLABS_AGENT_ID or ELEVENLABS_PHONE_ID environment variable.');
}

function testCall() {
    const payload = JSON.stringify({
        agent_id: AGENT_ID,
        agent_phone_number_id: PHONE_ID,
        to_number: '+17863212663', // calling own number or test number
        detect_voicemail: true
    });

    const options = {
        hostname: 'api.elevenlabs.io',
        path: '/v1/convai/twilio/outbound-call',
        method: 'POST',
        headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json',
            'Content-Length': payload.length
        }
    };

    const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Status Code:', res.statusCode);
            console.log('Response:', data);
        });
    });

    req.on('error', error => {
        console.error(error);
    });

    req.write(payload);
    req.end();
}

testCall();
