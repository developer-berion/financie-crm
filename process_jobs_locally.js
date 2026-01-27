
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

// CONFIG
const DRY_RUN = false; // Set to false to actually make the call
const AGENT_ID = 'agent_4101kf6gqfgpfrganck3s1m0ap3v';
const PHONE_ID = 'phnum_8001kfraqzk9f9rs3zv1ett3wqqe';

// Load Env
const envPath = path.resolve('.env.local');
let SERVICE_KEY = '';
let SUPABASE_URL = '';
let ELEVENLABS_API_KEY = '';

if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key && key.trim() === 'SUPABASE_SERVICE_ROLE_KEY') SERVICE_KEY = rest.join('=').trim().replace(/(^"|"$)/g, '');
        if (key && key.trim() === 'VITE_SUPABASE_URL') SUPABASE_URL = rest.join('=').trim().replace(/(^"|"$)/g, '');
        if (key && key.trim() === 'ELEVENLABS_API_KEY') ELEVENLABS_API_KEY = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}
SUPABASE_URL = SUPABASE_URL || 'https://cnkwnynujtyfslafsmug.supabase.co';

if (!SERVICE_KEY || !ELEVENLABS_API_KEY) {
    console.error('CRITICAL: Missing Keys inside .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// Helper for Context (Simplified)
function getLeadContext(stateStr, createdAt) {
    // Default to New York if missing
    // We won't do full timezone logic here to keep it simple, just basic formatting
    const date = new Date(createdAt);
    const dateStr = date.toLocaleDateString('es-US', { month: 'long', day: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    return {
        signup_date: dateStr,
        signup_time: timeStr,
        lead_state: stateStr || 'Estados Unidos'
    };
}

async function run() {
    console.log('🚀 Processing Jobs Locally...');

    // 1. Fetch pending jobs
    const { data: jobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'PENDING')
        .lte('scheduled_at', new Date().toISOString());

    if (jobsError) {
        console.error('Error fetching jobs:', jobsError);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log('No pending jobs found.');
        return;
    }

    console.log(`Found ${jobs.length} pending jobs.`);

    for (const job of jobs) {
        console.log(`Processing Job ${job.id} (Lead: ${job.lead_id})...`);

        try {
            if (job.type !== 'INITIAL_CALL') {
                console.warn(`Skipping unknown job type: ${job.type}`);
                continue;
            }

            // 2. Fetch Lead
            const { data: lead, error: leadError } = await supabase
                .from('leads')
                .select('*')
                .eq('id', job.lead_id)
                .single();

            if (leadError || !lead) {
                console.error(`Lead not found for job ${job.id}`);
                await updateJobStatus(job.id, 'FAILED', 'Lead not found');
                continue;
            }

            // 3. Prepare Call
            let rawPhone = lead.phone || '';
            let phone = rawPhone.replace(/\D/g, '');
            if (phone.length === 10) phone = '1' + phone;
            const formattedPhone = `+${phone}`;

            const context = getLeadContext(lead.state, lead.meta_created_at || lead.created_at);

            console.log(`Calling ${formattedPhone} (Agent: ${AGENT_ID})...`);

            // 4. ElevenLabs API
            const payload = {
                agent_id: AGENT_ID,
                agent_phone_number_id: PHONE_ID,
                to_number: formattedPhone,
                conversation_initiation_client_data: {
                    dynamic_variables: {
                        lead_name: lead.full_name,
                        lead_signup_date: context.signup_date,
                        lead_signup_time: context.signup_time,
                        lead_state: context.lead_state
                    }
                }
            };

            let result;
            if (!DRY_RUN) {
                const response = await fetch('https://api.elevenlabs.io/v1/convai/twilio/outbound-call', {
                    method: 'POST',
                    headers: {
                        'xi-api-key': ELEVENLABS_API_KEY,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                result = await response.json();

                if (!response.ok) {
                    console.error('ElevenLabs API Error:', result);
                    throw new Error(result.message || 'ElevenLabs Error');
                }
                console.log(`✅ Call Triggered! Call ID: ${result.call_id}`);
            } else {
                console.log('🚧 DRY RUN: Skipping ElevenLabs API Call.');
                console.log('Payload:', JSON.stringify(payload, null, 2));
                result = { call_id: 'MOCK_CALL_ID_' + Date.now() };
            }

            // 5. Update DB
            // Update Lead
            await supabase.from('leads').update({ last_call_id: result.call_id }).eq('id', lead.id);

            // Log Event
            await supabase.from('lead_events').insert({
                lead_id: lead.id,
                event_type: 'call.outbound_triggered',
                payload: {
                    provider: 'elevenlabs',
                    call_id: result.call_id,
                    trigger: 'local_script_rescue'
                }
            });

            // Update Job
            await updateJobStatus(job.id, 'COMPLETED', null);

        } catch (error) {
            console.error(`Job ${job.id} Failed:`, error);
            await updateJobStatus(job.id, 'FAILED', error.message);
        }
    }
}

async function updateJobStatus(jobId, status, errorMsg) {
    const { error } = await supabase.from('jobs').update({
        status: status,
        error: errorMsg
    }).eq('id', jobId);

    if (error) console.error('Error updating job status:', error);
}

run();
