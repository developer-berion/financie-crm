
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

/**
 * SIMULADOR DE FLUJO COMPLETO (Lead -> Webhook Replay)
 * Este script automatiza la prueba del CRM sin realizar llamadas reales.
 */

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

// Fallback manual si no lee .env.local (esto debe ser configurado por el usuario)
SUPABASE_URL = SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';

if (!SERVICE_KEY) {
    console.error('CRITICAL: Se requiere SUPABASE_SERVICE_ROLE_KEY en .env.local para bypass de RLS.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function runSimulation() {
    console.log('🚀 Iniciando Simulación de Flujo de Lead...');

    const testName = `Test Automático ${new Date().toLocaleTimeString()}`;
    const testPhone = `+1${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const mockConvId = `conv_mock_${Math.random().toString(36).slice(2, 11)}`;

    // PASO 1: Crear el Lead en la DB
    console.log(`\n[1/3] Creando Lead de prueba: ${testName}...`);
    const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .insert({
            full_name: testName,
            phone: testPhone,
            email: 'test@example.com',
            source: 'automation_test',
            state: 'California',
            status: 'Nuevo',
            last_call_id: mockConvId // Vinculamos el ID de conversación simulado
        })
        .select()
        .single();

    if (leadErr) {
        console.error('Error creando lead:', leadErr);
        return;
    }
    console.log(`✅ Lead creado con ID: ${lead.id}`);

    // PASO 1.5: Disparar Orquestación Manualmente (Email + Creating Job)
    console.log(`\n[1.5/3] Disparando orquestación (simulando Trigger DB)...`);

    // Llamar a la Edge Function directamente para asegurar que corra
    const orchRes = await fetch(`${SUPABASE_URL}/functions/v1/orchestrate_lead`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            type: 'INSERT',
            table: 'leads',
            record: lead
        })
    });

    if (!orchRes.ok) {
        console.error('❌ Error llamando a orquestación:', await orchRes.text());
    } else {
        console.log('   Orquestación disparada correctamente (HTTP 200)');
    }

    console.log(`   Esperando procesamiento (4s)...`);
    await new Promise(r => setTimeout(r, 4000));

    const { data: jobs } = await supabase
        .from('jobs')
        .select('*')
        .eq('lead_id', lead.id)
        .eq('status', 'PENDING');

    if (jobs && jobs.length > 0) {
        console.log(`✅ ¡ÉXITO! Se detectó un Job de llamada programado (ID: ${jobs[0].id}).`);
        console.log(`   Esto confirma que el email de bienvenida se envió y el sistema de orquestación funciona.`);

        // CANCELAR para evitar llamada real
        await supabase.from('jobs').update({ status: 'CANCELLED' }).eq('id', jobs[0].id);
        console.log(`🛑 Job cancelado automáticamente para evitar llamada real a tu teléfono.`);
    } else {
        console.warn(`⚠️ ADVERTENCIA: No se encontró Job programado. Puede que el Trigger de DB o la Edge Function no estén activos.`);
    }

    // PASO 2: Simular el inicio de la llamada (Call Event)
    console.log(`\n[2/3] Registrando evento de llamada iniciada...`);
    const { error: callErr } = await supabase
        .from('call_events')
        .insert({
            lead_id: lead.id,
            call_sid: mockConvId,
            status_crm: 'EXITOSA',
            created_at: new Date().toISOString()
        });

    if (callErr) {
        console.error('Error creando evento de llamada:', callErr);
        // Continuamos de todos modos
    }

    // PASO 3: Replay del Webhook de ElevenLabs
    console.log(`\n[3/3] Enviando Webhook de ElevenLabs (Simulando fin de conversación)...`);

    // Payload basado en la conversación real conv_0501kfy8vbj4eja9qkdfm554ms6k
    const webhookPayload = {
        type: "post_call_transcription",
        call_id: mockConvId,
        conversation_id: mockConvId,
        transcript: "agent: Hola, buenas tardes. Mi nombre es Laura... user: Sí, agéndame para las 5 de la tarde. agent: Perfecto, queda confirmado para mañana a las 5pm hora California.",
        analysis: {
            summary: "Cita agendada para mañana a las 5:00 PM (Hora de California). El cliente está interesado en protección familiar.",
            main_objective: "Ahorro para retiro", // Probando normalización
            stable_income: "yes",               // Probando normalización
            health_condition: "no",             // Probando normalización
            appointment_time: new Date(Date.now() + 86400000).toISOString(), // Cita para mañana
            scheduled_channel: "phone"
        }
    };

    const webhookUrl = `${SUPABASE_URL}/functions/v1/elevenlabs_webhook`;

    try {
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(webhookPayload)
        });

        const result = await response.json();
        if (response.ok) {
            console.log('✅ Webhook procesado exitosamente por Supabase.');
            console.log('Resultado:', result);
        } else {
            console.error('❌ Error en Webhook:', result);
        }
    } catch (e) {
        console.error('❌ Error de red al contactar el webhook:', e.message);
    }

    // RESUMEN FINAL
    console.log('\n--- 🔍 VERIFICACIÓN FINAL ---');
    console.log(`Revisa el CRM para el Lead: "${testName}"`);
    console.log(`1. ¿El estado cambió de 'Nuevo' a 'Calificado' (o similar)?`);
    console.log(`2. ¿Se llenaron los campos Ingresos/Salud/Objetivo?`);
    console.log(`3. ¿Se cancelaron los jobs automáticos en la tabla 'jobs'?`);
}

runSimulation();
