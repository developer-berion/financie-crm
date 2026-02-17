
import https from 'https';

const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';
const AGENT_ID = 'agent_4101kf6gqfgpfrganck3s1m0ap3v';
const PHONE_ID = 'phnum_8001kfraqzk9f9rs3zv1ett3wqqe';

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
