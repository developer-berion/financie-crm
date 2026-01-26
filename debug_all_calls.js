
import https from 'https';

const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';

async function getConversations() {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: { 'xi-api-key': API_KEY }
        };
        const req = https.request('https://api.elevenlabs.io/v1/convai/conversations?page_size=10', options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
    });
}

async function getConversationDetail(convId) {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: { 'xi-api-key': API_KEY }
        };
        const req = https.request(`https://api.elevenlabs.io/v1/convai/conversations/${convId}`, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    try {
        console.log('Fetching last 10 conversations...');
        const list = await getConversations();

        if (!list.conversations || list.conversations.length === 0) {
            console.log('No conversations found.');
            return;
        }

        for (const c of list.conversations) {
            const detail = await getConversationDetail(c.conversation_id);
            const to = detail.metadata?.phone_call?.external_number || 'N/A';
            const status = c.status;
            const time = new Date(c.start_time_unix_secs * 1000).toISOString();
            console.log(`Conv: ${c.conversation_id} | To: ${to} | Status: ${status} | Date: ${time}`);
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
