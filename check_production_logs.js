
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error('Missing Service Key');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkLogs() {
    console.log('--- Integration Logs (Recent) ---');
    const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.table(data.map(l => ({
        id: l.id,
        provider: l.provider,
        status: l.status,
        msg: l.message_safe,
        time: l.created_at
    })));
}

async function checkLeadEvents() {
    console.log('--- Lead Events (Recent) ---');
    const { data, error } = await supabase
        .from('lead_events')
        .select(`
            *,
            leads ( full_name )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error(error);
        return;
    }

    console.table(data.map(l => ({
        lead: l.leads?.full_name,
        type: l.event_type,
        payload: JSON.stringify(l.payload).substring(0, 50),
        time: l.created_at
    })));
}

async function run() {
    await checkLogs();
    await checkLeadEvents();
}

run();
