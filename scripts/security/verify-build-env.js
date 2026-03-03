import fs from 'node:fs';
import path from 'node:path';

const requiredEnv = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

function fail(message) {
  console.error(`[verify:build-env] ${message}`);
  process.exit(1);
}

function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const out = {};
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
    out[key] = value;
  }
  return out;
}

const envLocal = parseEnvFile(path.join(process.cwd(), '.env.local'));

function readEnv(name) {
  return (process.env[name] || envLocal[name] || '').trim();
}

for (const key of requiredEnv) {
  if (!readEnv(key)) {
    fail(`Missing required environment variable: ${key}`);
  }
}

const supabaseUrl = readEnv('VITE_SUPABASE_URL');
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  fail(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
}

const anonKey = readEnv('VITE_SUPABASE_ANON_KEY');
if (anonKey.length < 100) {
  fail('VITE_SUPABASE_ANON_KEY looks invalid (too short).');
}

if (/^(your_|changeme|replace_me|todo)/i.test(anonKey)) {
  fail('VITE_SUPABASE_ANON_KEY appears to be a placeholder.');
}

console.log('[verify:build-env] OK');
