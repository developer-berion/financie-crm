
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Cargar Variables de Entorno
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

// Fallback manual
SUPABASE_URL = SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';

console.log(`Debug: URL: ${SUPABASE_URL}`);

if (!SERVICE_KEY) {
    console.error('CRITICAL: Se requiere SUPABASE_SERVICE_ROLE_KEY en .env.local para bypass de RLS.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

console.log('🚀 Triggering Scheduler (process_jobs) via supabase-js...');

async function triggerScheduler() {
    try {
        const { data, error } = await supabase.functions.invoke('process_jobs', {
            body: {}
        });

        if (error) {
            console.error('❌ Error invoking function:', error);
            // Print details if available
            if (error instanceof Error) {
                console.error(error.message);
                console.error(error.stack);
            }
        } else {
            console.log('✅ Function invoked successfully.');
            console.log('Response:', JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.error('Exception triggering scheduler:', error);
    }
}

triggerScheduler();
