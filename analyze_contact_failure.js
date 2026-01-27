
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Cargar Entorno (Reuse logic)
const envPath = path.resolve('.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
    console.error("❌ Need SUPABASE_SERVICE_ROLE_KEY to check logs.");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const LEAD_ID = '83fd0162-249b-4655-a85d-324732d2e915';

async function analyze() {
    console.log(`\n🔍 Analyzing Lead: ${LEAD_ID}`);

    // 1. Fetch Lead
    const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', LEAD_ID)
        .single();

    if (leadError) {
        console.error('❌ Lead Error:', leadError);
        return;
    }

    if (!lead) {
        console.error('❌ Lead not found in database.');
        return;
    }

    console.log('✅ Lead found:', JSON.stringify(lead, null, 2));

    // 2. Check Lead Events
    const { data: events, error: eventError } = await supabase
        .from('lead_events')
        .select('*')
        .eq('lead_id', LEAD_ID)
        .order('created_at', { ascending: false });

    // 3. Check Integration Logs (Brevo/Twilio)
    // Note: payload_ref is JSONB, we check if it contains lead_id
    const { data: logs, error: logError } = await supabase
        .from('integration_logs')
        .select('*')
        .contains('payload_ref', { lead_id: LEAD_ID })
        .order('created_at', { ascending: false });

    if (eventError) {
        console.error('❌ Error fetching events:', eventError);
    } else {
        console.log(`\n📄 Found ${events.length} events for this lead:`);
        events.forEach(e => {
            console.log(`   - [${e.created_at}] ${e.event_type} (Provider: ${e.payload?.provider || 'N/A'})`);
            if (e.event_type === 'call.outbound_triggered') {
                console.log(`     Payload:`, JSON.stringify(e.payload, null, 2));
            }
        });
    }

    // 4. Check System Health (Events around the time)
    const targetTime = new Date('2026-01-27T17:28:54+00:00');
    const windowStart = new Date(targetTime.getTime() - 10 * 60 * 1000).toISOString();
    const windowEnd = new Date(targetTime.getTime() + 10 * 60 * 1000).toISOString();

    const { data: nearbyEvents } = await supabase
        .from('lead_events')
        .select('id, created_at, event_type, lead_id')
        .gte('created_at', windowStart)
        .lte('created_at', windowEnd)
        .order('created_at', { ascending: true });

    console.log(`\n🏥 System Health Check (${windowStart} - ${windowEnd}):`);
    if (nearbyEvents && nearbyEvents.length > 0) {
        console.log(`   Found ${nearbyEvents.length} events processing in this window.`);
        nearbyEvents.forEach(e => {
            console.log(`   - [${e.created_at}] ${e.event_type} (Lead: ${e.lead_id})`);
        });
    } else {
        console.log('   ⚠️ NO EVENTS found in this 20-minute window. System might have been idle or down.');
    }

    if (logError) {
        console.error('❌ Error fetching logs:', logError);
    } else {
        console.log(`\n📄 Found ${logs.length} integration logs for this lead:`);
        logs.forEach(l => {
            console.log(`   - [${l.created_at}] ${l.provider}: ${l.status} - ${l.message_safe}`);
        });
    }
}

analyze();
