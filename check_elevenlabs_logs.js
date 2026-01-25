
import https from 'https';

const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';

async function checkHistory() {
    console.log('--- Checking ElevenLabs Conversation History ---');

    const options = {
        method: 'GET',
        headers: {
            'xi-api-key': API_KEY
        }
    };

    const req = https.request('https://api.elevenlabs.io/v1/convai/conversations?page_size=3', options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            if (res.statusCode === 200) {
                const json = JSON.parse(data);
                console.log('Raw result summary:', JSON.stringify(json, null, 2).slice(0, 500));

                if (json.conversations && json.conversations.length > 0) {
                    json.conversations.forEach(c => {
                        const time = c.start_time_unix_ms || (c.start_time * 1000) || 0;
                        console.log(`Conv: ${c.conversation_id}, Status: ${c.status}, Created: ${new Date(time).toISOString()}`);
                        console.log(`To: ${c.call_to_number || 'N/A'}`);
                    });
                } else {
                    console.log('No conversations found.');
                }
            } else {
                console.error(`Error ${res.statusCode}:`, data);
            }
        });
    });

    req.on('error', (e) => console.error(e));
    req.end();
}

checkHistory();
