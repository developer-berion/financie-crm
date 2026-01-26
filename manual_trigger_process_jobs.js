
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// Load Env
const envPath = path.resolve('.env.local');
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/(^"|"$)/g, '');
        }
    });
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error('CRITICAL: SERVICE_KEY missing. Cannot trigger function.');
    // Try to rely on hardcoded or different check? 
    // In this environment, I cannot proceed without it.
    process.exit(1);
}

// Function to call the process_jobs endpoint
async function triggerProcessJobs() {
    console.log('--- Triggering process_jobs (Manual Scheduler Run) ---');
    const url = `${SUPABASE_URL}/functions/v1/process_jobs`;
    console.log(`URL: ${url}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SERVICE_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({})
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log('Response Body:', text);
    } catch (e) {
        console.error('Error triggering function:', e);
    }
}

triggerProcessJobs();
