
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

/**
 * MONITOR DE SALUD DE INTEGRACIONES (Health Check)
 * Verifica que todos los servicios externos y webhooks estén operativos.
 */

// 1. Cargar Entorno
const envPath = path.resolve('.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const ANON_KEY = env.VITE_SUPABASE_ANON_KEY;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY; // Requerido para verificación profunda
const ELEVENLABS_KEY = env.ELEVENLABS_API_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
    console.error('Missing SUPABASE_URL/VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment.');
    process.exit(1);
}

async function verify() {
    console.log('\n🔍 --- MONITOR DE SALUD DE INTEGRACIONES ---');
    console.log(`Fecha: ${new Date().toLocaleString()}\n`);

    const results = [];

    // --- 1. SUPABASE CONNECTION ---
    try {
        const supabase = createClient(SUPABASE_URL, ANON_KEY);
        const { data, error } = await supabase.from('leads').select('count', { count: 'exact', head: true });
        if (error) throw error;
        results.push({ service: 'Supabase DB', status: '✅ OK', details: `Conexión exitosa al proyecto.` });
    } catch (e) {
        results.push({ service: 'Supabase DB', status: '❌ FAIL', details: e.message });
    }

    // --- 2. ELEVENLABS API ---
    try {
        const elResp = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
            headers: { 'xi-api-key': ELEVENLABS_KEY }
        });
        const elData = await elResp.json();
        if (elResp.ok) {
            results.push({
                service: 'ElevenLabs API',
                status: '✅ OK',
                details: `Válida ($${elData.character_count}/${elData.character_limit} chars)`
            });
        } else {
            throw new Error(elData.detail?.message || 'Key inválida');
        }
    } catch (e) {
        results.push({ service: 'ElevenLabs API', status: '❌ FAIL', details: e.message });
    }

    // --- 3. WEBHOOK ELEVENLABS (PING) ---
    try {
        const whResp = await fetch(`${SUPABASE_URL}/functions/v1/elevenlabs_webhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'health_check_ping' })
        });
        if (whResp.ok) {
            results.push({ service: 'Webhook ElevenLabs', status: '✅ OK', details: 'Endpoint público accesible.' });
        } else {
            results.push({ service: 'Webhook ElevenLabs', status: '⚠️ ISSUE', details: `Status ${whResp.status} (Posible JWT o IP)` });
        }
    } catch (e) {
        results.push({ service: 'Webhook ElevenLabs', status: '❌ FAIL', details: e.message });
    }

    // --- 4. ORCHESTRATION WEBHOOK (PING) ---
    try {
        const orchestrationResp = await fetch(`${SUPABASE_URL}/functions/v1/orchestrate_lead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'ping' })
        });
        if (orchestrationResp.ok || orchestrationResp.status < 500) {
            results.push({ service: 'Webhook Orchestrate Lead', status: '✅ OK', details: `Status ${orchestrationResp.status}` });
        } else {
            results.push({ service: 'Webhook Orchestrate Lead', status: '⚠️ ISSUE', details: `Status ${orchestrationResp.status}` });
        }
    } catch (e) {
        results.push({ service: 'Webhook Orchestrate Lead', status: '❌ FAIL', details: e.message });
    }

    // --- 5. LOGS DE INTEGRACIÓN RECIENTES (Necesita SERVICE_KEY) ---
    if (SERVICE_KEY) {
        try {
            const adminSupabase = createClient(SUPABASE_URL, SERVICE_KEY);
            const { data: logs } = await adminSupabase
                .from('integration_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(3);

            const lastLogTime = logs?.length > 0 ? new Date(logs[0].created_at).toLocaleTimeString() : 'N/A';
            results.push({
                service: 'Logs (Brevo/Twilio)',
                status: '✅ OK',
                details: `Última actividad: ${lastLogTime}`
            });
        } catch (e) {
            results.push({ service: 'Logs (Brevo/Twilio)', status: '⚠️ NO DATA', details: 'Requiere Service Key válida.' });
        }
    } else {
        results.push({ service: 'Logs (Admin)', status: '⏭️ SKIP', details: 'Falta SUPABASE_SERVICE_ROLE_KEY en .env.local' });
    }

    // MOSTRAR TABLA DE RESULTADOS
    console.table(results);

    const allOk = results.every(r => r.status.includes('✅'));
    if (allOk) {
        console.log('\n🌟 INTEGRACIÓN ESTABLE: Todos los sistemas se comunican correctamente.\n');
    } else {
        console.log('\n⚠️ ATENCIÓN: Se detectaron problemas o falta configuración en algunos servicios.\n');
    }
}

verify();
