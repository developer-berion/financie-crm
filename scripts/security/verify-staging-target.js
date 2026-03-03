import fs from 'fs';
import path from 'path';

const root = process.cwd();
const envPath = path.join(root, '.env.local');
const projectRefPath = path.join(root, 'supabase', '.temp', 'project-ref');

function parseEnv(content) {
  const out = {};
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

if (!fs.existsSync(envPath)) {
  console.error('Missing .env.local file.');
  process.exit(1);
}

if (!fs.existsSync(projectRefPath)) {
  console.error('Missing supabase/.temp/project-ref file.');
  process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const envUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
const expectedRef = fs.readFileSync(projectRefPath, 'utf8').trim();

if (!envUrl) {
  console.error('Missing VITE_SUPABASE_URL/SUPABASE_URL in .env.local.');
  process.exit(1);
}

const match = envUrl.match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/i);
if (!match) {
  console.error(`Invalid Supabase URL format: ${envUrl}`);
  process.exit(1);
}

const envRef = match[1];
if (envRef !== expectedRef) {
  console.error(`Environment mismatch. .env.local points to '${envRef}' but supabase/.temp/project-ref is '${expectedRef}'.`);
  process.exit(1);
}

console.log(`Staging target verified: ${envRef}`);
