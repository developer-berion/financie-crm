import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to .env.local
const envPath = path.resolve(__dirname, '../.env.local');

// Helper to parse .env file
function parseEnv(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`Error: .env file not found at ${filePath}`);
        process.exit(1);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const env = {};

    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
            env[key] = value;
        }
    });

    return env;
}

const envConfig = parseEnv(envPath);

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

// Prepare environment variables for the child process
const childEnv = {
    ...process.env,
    SUPABASE_URL: supabaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: supabaseKey,
    SUPABASE_ACCESS_TOKEN: supabaseKey // Try using service key as access token
};

// Spawn the MCP server
const child = spawn('npx', ['-y', '@supabase/mcp-server-supabase'], {
    env: childEnv,
    stdio: ['inherit', 'inherit', 'inherit'], // Pass through stdin/stdout/stderr
    shell: true
});

child.on('error', (err) => {
    console.error('Failed to start subprocess:', err);
    process.exit(1);
});

child.on('exit', (code, signal) => {
    if (code) process.exit(code);
    if (signal) process.kill(process.pid, signal);
});
