
import https from 'https';

const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';
const AGENT_ID = 'agent_4101kf6gqfgpfrganck3s1m0ap3v';

async function checkAgent() {
    console.log(`--- Checking Agent ${AGENT_ID} ---`);

    const options = {
        method: 'GET',
        headers: {
            'xi-api-key': API_KEY
        }
    };

    const req = https.request(`https://api.elevenlabs.io/v1/convai/agents/${AGENT_ID}`, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                const json = JSON.parse(data);
                // Log only conversation_config to avoid truncation
                console.log('Conversation Config:', JSON.stringify(json.conversation_config, null, 2));
            } else {
                console.error(`Error ${res.statusCode}:`, data);
            }
        });
    });

    req.on('error', (e) => console.error(e));
    req.end();
}

checkAgent();
