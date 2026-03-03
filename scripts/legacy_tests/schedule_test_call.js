
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
const phone = '7864368033';

if (!SUPABASE_URL || !ANON_KEY) {
    throw new Error('Missing SUPABASE_URL/VITE_SUPABASE_URL or SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY.');
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function scheduleCall() {
    console.log(`--- Searching for Lead with Phone: ${phone} ---`);

    // We try to find the lead. Since RLS might be active, we hope the Anon key has permission 
    // to see it if it's "New" or if the user is logged in (but here we just have keys).
    // If this fails, I'll need the user to provide the correct UUID or verify RLS.

    const { data: leads, error: leadErr } = await supabase
        .from('leads')
        .select('id, full_name, phone')
        .or(`phone.like.%${phone}%,phone.eq.+1${phone}`);

    if (leadErr) {
        console.error('Lead Search Error:', leadErr);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('No lead found with that phone number.');
        return;
    }

    const lead = leads[0];
    console.log(`Found Lead: ${lead.full_name} (${lead.id})`);

    const scheduledAt = new Date(Date.now() + 3 * 60 * 1000).toISOString();
    console.log(`Scheduling call for: ${scheduledAt}`);

    const { data: job, error: jobErr } = await supabase
        .from('jobs')
        .insert({
            lead_id: lead.id,
            type: 'INITIAL_CALL',
            scheduled_at: scheduledAt,
            status: 'PENDING'
        })
        .select()
        .single();

    if (jobErr) {
        console.error('Job Insertion Error:', jobErr);
    } else {
        console.log('Successfully scheduled job:', JSON.stringify(job, null, 2));
    }
}

scheduleCall();
