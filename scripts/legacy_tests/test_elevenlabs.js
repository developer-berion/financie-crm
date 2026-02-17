import https from 'https';

const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';
const PHONE_ID = 'phnum_8001kfraqzk9f9rs3zv1ett3wqqe';

function makeRequest(path, label) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.elevenlabs.io',
            path: path,
            method: 'GET',
            headers: {
                'xi-api-key': API_KEY,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve({ statusCode: res.statusCode, data: json, label });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, data: data, label, error: e });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.end();
    });
}

console.log('Testing connection to ElevenLabs...');

// 1. Test Basic Authentication (User Info)
makeRequest('/v1/user', 'User Info')
    .then(result => {
        if (result.statusCode === 200) {
            console.log('✅ [User Info]: SUCCESS - API Key is valid.');
            // console.log('User details:', JSON.stringify(result.data, null, 2));
        } else {
            console.error(`❌ [User Info]: FAILED (Status ${result.statusCode})`);
            console.error('Error:', JSON.stringify(result.data, null, 2));
        }
        return makeRequest(`/v1/convai/phone-numbers/${PHONE_ID}`, 'Phone Number Details');
    })
    .then(result => {
        if (result.statusCode === 200) {
            console.log('✅ [Phone Detail]: SUCCESS - Phone ID verified.');
        } else {
            console.warn(`⚠️ [Phone Detail]: FAILED (Status ${result.statusCode})`);
            console.warn('Note: This might be due to missing "convai_read" permissions, but if [User Info] passed, the key is valid for other operations.');
            console.warn('Error:', JSON.stringify(result.data, null, 2));
        }
    })
    .catch(err => {
        console.error('Network Error:', err);
    });
