
// simulate_flow.js
// Usage: node simulate_flow.js

import { createClient } from '@supabase/supabase-js';
import https from 'https';

// --- CONFIGURATION ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co'; // Fallback to what we saw in migration
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Requires user to set this or we hardcode for test if available (User didn't provide it, triggers won't fire)
// Wait, for this script to work, we need credentials to insert into DB. 
// We can use the Anon key if RLS allows, but usually we need Service Role for internal logic.
// However, the USER asked for simulation. The environment has keys in .env.local usually.
// Let's assume we can read .env.local or ask user.
// Since I cannot read .env.local easily without `dotenv`. I'll try to read it manually.

import fs from 'fs';
import path from 'path';

function loadEnv() {
    try {
        const envPath = path.resolve('.env.local');
        if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8');
            const lines = content.split('\n');
            lines.forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const val = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
                    process.env[key] = val;
                }
            });
            console.log('Loaded .env.local');
        }
    } catch (e) {
        console.warn('Could not load .env.local', e);
    }
}

loadEnv();

const SIM_PHONE = '(786) 436-8033';
const API_KEY = 'sk_befb61153a1ac7c305388ea72745d8162d0610d4a6200e3e';
const PHONE_ID = 'phnum_8001kfraqzk9f9rs3zv1ett3wqqe';
const AGENT_ID = 'agent_4101kf6gqfgpfrganck3s1m0ap3v';

async function runSimulation() {
    console.log('--- STARTING CALL SIMULATION ---');

    // 1. Simulate "Make.com" Insertion
    // Since we don't have write access easily without service key, 
    // AND the user wants the CALL, we can simulate the CALL LOGIC directly using the data.

    console.log(`Target Phone: ${SIM_PHONE}`);

    // Normalize Phone Logic from `make_outbound_call`
    let phone = SIM_PHONE.replace(/\D/g, '');
    // If 10 digits, assume US and add 1
    if (phone.length === 10) phone = '1' + phone;
    const formattedPhone = `+${phone}`;
    console.log(`Normalized Phone: ${formattedPhone}`);

    // Payload Logic
    const payload = {
        agent_id: AGENT_ID,
        agent_phone_number_id: PHONE_ID,
        to_number: formattedPhone,
        conversation_initiation_client_data: {
            dynamic_variables: {
                lead_name: 'Victor Test' // Mock name
            }
        }
    };

    console.log('Executing ElevenLabs API Call (Twilio Endpoint)...');
    console.log(`Endpoint: https://api.elevenlabs.io/v1/convai/twilio/outbound-call`);

    const req = https.request('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
        method: 'POST',
        headers: {
            'xi-api-key': API_KEY,
            'Content-Type': 'application/json'
        }
    }, (res) => {
        console.log(`Status Code: ${res.statusCode}`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log('Response Body:', data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('✅ SUCCESS: Call initiated!');
                try {
                    const json = JSON.parse(data);
                    console.log('Call ID:', json.call_id);
                } catch (e) { }
            } else {
                console.error('❌ FAILURE: Call failed.');
            }
        });
    });

    req.on('error', (e) => {
        console.error('Network Error:', e);
    });

    req.write(JSON.stringify(payload));
    req.end();
}

runSimulation();
