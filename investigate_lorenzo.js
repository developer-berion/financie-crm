
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

// Fallback manual si no lee .env.local
SUPABASE_URL = SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';

if (!SERVICE_KEY) {
    console.error('CRITICAL: Se requiere SUPABASE_SERVICE_ROLE_KEY en .env.local para bypass de RLS.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function investigateLead() {
    console.log('🔍 Investigando lead de Lorenzo...');

    // 1. Buscar Lead
    const { data: leads, error: leadErr } = await supabase
        .from('leads')
        .select('*')
        .ilike('full_name', '%Lorenzo%');

    if (leadErr) {
        console.error('Error buscando lead:', leadErr);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('⚠️ No se encontró ningún lead con nombre "Lorenzo".');
        return;
    }

    console.log(`✅ Se encontraron ${leads.length} leads coincdentes.`);

    for (const lead of leads) {
        console.log('\n--- Detalle del Lead ---');
        console.log(`ID: ${lead.id}`);
        console.log(`Nombre: ${lead.full_name}`);
        console.log(`Teléfono: ${lead.phone}`);
        console.log(`Email: ${lead.email}`);
        console.log(`Estado: ${lead.status}`);
        console.log(`Creado: ${lead.created_at}`);

        // 2. Buscar Eventos
        const { data: events, error: eventErr } = await supabase
            .from('lead_events')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: true });

        if (eventErr) console.error('Error buscando eventos:', eventErr);

        console.log('\n--- Eventos (Timeline) ---');
        if (events && events.length > 0) {
            events.forEach(e => console.log(`[${e.created_at}] ${e.event_type}: ${JSON.stringify(e.payload || {})}`)); // Changed type -> event_type, metadata -> payload
        } else {
            console.log('No hay eventos registrados.');
        }

        // 3. Buscar Jobs
        const { data: jobs, error: jobErr } = await supabase
            .from('jobs')
            .select('*')
            .eq('lead_id', lead.id)
            .order('created_at', { ascending: true });

        if (jobErr) console.error('Error buscando jobs:', jobErr);

        console.log('\n--- Jobs (Llamadas programadas) ---');
        if (jobs && jobs.length > 0) {
            jobs.forEach(j => {
                console.log(`[${j.created_at}] ID: ${j.id}, Estado: ${j.status}, Tipo: ${j.type}, Ejecutar en: ${j.scheduled_at}`);
                if (j.error_log) console.log(`   ❌ Error Log: ${JSON.stringify(j.error_log)}`);
            });
        } else {
            console.log('No hay jobs registrados para este lead.');
        }
    }
}

investigateLead();
