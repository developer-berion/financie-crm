
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Determine environment - simplified loading
const envPath = path.resolve('.env.local');
let output = '';

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
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY. Cannot access DB.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function checkJobs() {
    console.log('--- Checking Recent Jobs ---');
    const { data: jobs, error } = await supabase
        .from('jobs')
        .select(`
            *,
            leads ( full_name, phone )
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching jobs:', error);
        return;
    }

    if (!jobs || jobs.length === 0) {
        console.log('No jobs found.');
    } else {
        console.table(jobs.map(j => ({
            id: j.id,
            lead: j.leads?.full_name,
            phone: j.leads?.phone,
            type: j.type,
            status: j.status,
            scheduled: j.scheduled_at,
            error: j.error ? j.error.substring(0, 50) + '...' : null
        })));
    }
}

async function checkCron() {
    console.log('\n--- Checking Cron Jobs (if accessible) ---');
    // We can't easily check cron.job from client, but we can check if jobs are pending for a long time.
    const { data: pending, error } = await supabase
        .from('jobs')
        .select('id, scheduled_at, created_at')
        .eq('status', 'PENDING')
        .lt('scheduled_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()); // Scheduled more than 5 mins ago

    if (pending && pending.length > 0) {
        console.warn(`WARNING: ${pending.length} jobs are PENDING and past due! Scheduler might be broken.`);
    } else {
        console.log('No stuck pending jobs found.');
    }
}

async function run() {
    await checkJobs();
    await checkCron();
}

run();
