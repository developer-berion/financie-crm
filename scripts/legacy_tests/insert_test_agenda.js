
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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
    console.error('CRITICAL: SERVICE_KEY missing.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function createTestAgendaLead() {
    console.log('--- Creating Test Agenda Lead ---');

    // 1. Insert Lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([{
            full_name: 'Carlos Test Agenda',
            phone: '(555) 123-4567',
            email: 'carlos@test.com',
            source: 'agenda_test',
            status: 'Nuevo'
        }])
        .select()
        .single();

    if (leadError) {
        console.error('Error creating lead:', leadError);
        return;
    }

    console.log(`✅ Lead created: ${lead.id}`);

    // 2. Insert call event
    const callSid = `test_sid_${lead.id}`;
    const { error: callError } = await supabase
        .from('call_events')
        .insert([{
            lead_id: lead.id,
            call_sid: callSid,
            status_crm: 'EXITOSA',
            duration_seconds: 120
        }]);

    if (callError) {
        console.error('Error creating call event:', callError);
        return;
    }

    // 3. Insert conversation result
    const { error: convError } = await supabase
        .from('conversation_results')
        .insert([{
            lead_id: lead.id,
            call_sid: callSid,
            conversation_id: `conv_${callSid}`,
            transcript: 'Hola Carlos, quedamos entonces para el lunes 27 de enero a las 11:00 AM para revisar tu plan de retiro.',
            summary: 'El cliente está interesado en un plan de retiro y agendó una cita.',
            outcome: { call_outcome: 'Cita Agendada' }
        }]);

    if (convError) {
        console.error('Error creating conversation result:', convError);
        return;
    }

    console.log('✅ All test data inserted successfully!');
    console.log(`URL: http://localhost:5173/leads/${lead.id}`);
}

createTestAgendaLead();
