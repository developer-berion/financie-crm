
import https from 'https';

const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';

async function getConversations() {
    return new Promise((resolve, reject) => {
        const options = {
            method: 'GET',
            headers: { 'xi-api-key': API_KEY }
        };
        const req = https.request('https://api.elevenlabs.io/v1/convai/conversations?page_size=1', options, (res) => {
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
        console.log('Fetching last conversation...');
        const list = await getConversations();

        if (!list.conversations || list.conversations.length === 0) {
            console.log('No conversations found.');
            return;
        }

        const lastConv = list.conversations[0];
        console.log('Last Conversation Summary:', JSON.stringify(lastConv, null, 2));

        console.log('\nFetching Details...');
        const detail = await getConversationDetail(lastConv.conversation_id);
        console.log('Detail:', JSON.stringify(detail, null, 2));

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
