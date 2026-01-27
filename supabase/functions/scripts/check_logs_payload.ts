
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkLogs() {
    const { data, error } = await supabase
        .from('integration_logs')
        .select('*')
        .eq('provider', 'elevenlabs')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching logs:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Latest ElevenLabs Log Payload:');
        console.log(JSON.stringify(data[0].payload_ref, null, 2));
    } else {
        console.log('No recent ElevenLabs logs found.');
    }
}

checkLogs();
