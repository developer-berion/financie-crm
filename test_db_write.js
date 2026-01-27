
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Cargar Variables
const envPath = path.resolve('.env.local');
let SERVICE_KEY = '';
let SUPABASE_URL = '';

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_KEY = rest.join('=').trim().replace(/(^"|"$)/g, '');
        if (key && key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}
SUPABASE_URL = SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';

if (!SERVICE_KEY) {
    console.error('CRITICAL: No Key');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function testWrite() {
    console.log('Testing DB Write...');
    // Try to update a non-existent record or just verify a read-then-update
    // We'll try to insert a log into integration_logs
    const { data, error } = await supabase.from('integration_logs').insert({
        provider: 'test_script',
        status: 'info',
        message_safe: 'Testing DB Write Permission',
        payload_ref: { timestamp: new Date().toISOString() }
    }).select();

    if (error) {
        console.error('❌ Write failed:', error);
    } else {
        console.log('✅ Write successful! ID:', data[0].id);
        // Clean up
        await supabase.from('integration_logs').delete().eq('id', data[0].id);
        console.log('✅ Clean up successful');
    }
}

testWrite();
