
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
        const [key, ...rest] = line.split('=');
        if (key) env[key.trim()] = rest.join('=').trim().replace(/(^"|"$)/g, '');
    });
}

const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const MIGRATION_FILE = 'supabase/migrations/20260127180000_sync_schedules_jobs.sql';

async function applyMigration() {
    console.log(`\n🚀 Applying migration: ${MIGRATION_FILE}`);

    if (!fs.existsSync(MIGRATION_FILE)) {
        console.error('❌ Migration file not found!');
        process.exit(1);
    }

    const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');

    // We use a hacky way to run SQL via Postgres function 'exec_sql' if it exists, 
    // BUT usually we don't have that exposed. 
    // Alternatively, we can use the 'rpc' if we have a 'run_sql' function, 
    // OR we just use the 'postgres' connection if we had one.
    // SINCE we don't have a direct SQL runner here, we will try to assume 
    // the user has a setup for this.
    // WAIT: I might not have a direct way to run raw DDL via supabase-js client 
    // unless there is a specific function enabled for it.

    // Let's check if we can run it via a specific "run_non_query" or similar if available,
    // otherwise I might need to ask the user to run it OR assume I can use a predefined RPC.

    // In this specific environment (Supabase), often 'verify_integrations.js' or similar tools 
    // suggest we might be able to run SQL via a helper or just "hope" there's a function.
    // Actually, looking at the file list, I see `fix_scheduler_force.sql`.

    // LET'S TRY to run it using the standard Postgres connection string if accessible? 
    // No, I only have the keys.

    // OK, checking previous steps... The user has many SQL files. 
    // I will try to use the `pg` library if installed? No `node_modules` inspection done yet for that.

    // ALTERNATIVE: Use the dashboard? I can't.
    // ALTERNATIVE: Create a "test" RPC function? No.

    // BEST BET: Check if there is a previously used script for running SQL. 
    // I see `check_logs.sql`. 

    // Actually, looking at `insert_real_elevenlabs_data.sql`...
    // I will assume I CANNOT run DDL directly from JS without a special RPC owner function.
    // However, I CANNOT create that function without running SQL first. Catch-22.

    // Exception: If `exec_sql` or similar exists. Let's try to call a common name `exec_sql`.

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    // If that fails, I might have to "simulate" the trigger logic in my fix script 
    // and tell the user to run the migration in their dashboard. 
    // BUT the user asked me to "proceed".

    // Wait, I saw `supabase/functions`. Maybe I can deploy? No.

    // Let's TRY to see if `exec` or `run_sql` exists.
    // If not, I will update the fix script to do BOTH the schedule update AND the job creation manually,
    // and save the SQL file for the user to apply later for "future" sync.
    // That satisfies the immediate request "Create the technical task in jobs".

    if (error) {
        console.error('⚠️ Could not run SQL via RPC (normal if not set up).');
        console.error('Error:', error);
        console.log('ℹ️ I will handle the immediate sync manually in the fix script.');
    } else {
        console.log('✅ Migration applied successfully via RPC!');
    }
}

applyMigration();
