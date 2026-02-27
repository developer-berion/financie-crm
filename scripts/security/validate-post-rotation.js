import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';

const ROOT = process.cwd();
const ENV_FILE = path.join(ROOT, '.env.local');
const STAGING_REF_FILE = path.join(ROOT, 'supabase', '.temp', 'project-ref');
const AUTH_ERROR_PATTERN = /(auth|unauthor|forbidden|invalid key|signature)/i;
const STRICT = process.argv.includes('--strict');
const SKIP_SECRET_SCAN = process.argv.includes('--skip-secret-scan');

function parseEnv(content) {
  const parsed = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const idx = trimmed.indexOf('=');
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^"|"$/g, '');
    parsed[key] = value;
  }
  return parsed;
}

function loadEnv() {
  const fileEnv = fs.existsSync(ENV_FILE)
    ? parseEnv(fs.readFileSync(ENV_FILE, 'utf8'))
    : {};
  return { ...fileEnv, ...process.env };
}

function getProjectRefFromUrl(supabaseUrl) {
  const match = String(supabaseUrl || '').match(/^https:\/\/([a-z0-9]+)\.supabase\.co$/i);
  return match ? match[1] : null;
}

function truncate(value, max = 180) {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();
  return text.length <= max ? text : `${text.slice(0, max)}...`;
}

function summarizeScanOutput(rawOutput) {
  const lines = String(rawOutput || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);
  return lines.length > 0 ? lines.join(' | ') : 'No output';
}

function addCheck(checks, status, level, name, details) {
  checks.push({ status, level, name, details });
}

function runSecretScan(checks) {
  if (SKIP_SECRET_SCAN) {
    addCheck(checks, 'SKIP', 'warning', 'Secret scan gate', 'Skipped via --skip-secret-scan');
    return;
  }

  const scan = spawnSync(process.execPath, ['scripts/security/check-secrets.js'], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  if (scan.status === 0) {
    addCheck(checks, 'PASS', 'critical', 'Secret scan gate', 'No hardcoded secrets detected');
    return;
  }

  addCheck(
    checks,
    'FAIL',
    'critical',
    'Secret scan gate',
    summarizeScanOutput(scan.stderr || scan.stdout),
  );
}

async function fetchJson(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    try {
      const resp = await fetch(url, { ...options, signal: controller.signal });
      let json = null;
      let text = '';
      try {
        json = await resp.json();
      } catch {
        try {
          text = await resp.text();
        } catch {
          text = '';
        }
      }
      return { ok: resp.ok, status: resp.status, json, text, error: null };
    } catch (error) {
      return {
        ok: false,
        status: 0,
        json: null,
        text: '',
        error: error instanceof Error ? error.message : String(error),
      };
    }
  } finally {
    clearTimeout(timeout);
  }
}

function evaluateIntegrityServices(checks, results, hasElevenLabsKey, communicationsEnabled) {
  const expected = new Map([
    ['Supabase Database', new Set(['ONLINE'])],
    ['Edge orchestrate_lead', new Set(['ONLINE'])],
    ['Edge call_dispatcher', new Set(['ONLINE'])],
  ]);

  if (communicationsEnabled) {
    expected.set('Edge elevenlabs_webhook', new Set(['ONLINE']));
  } else {
    expected.set('Edge elevenlabs_webhook', new Set(['SKIPPED']));
  }

  for (const [service, allowedStatuses] of expected.entries()) {
    const row = results.find((item) => item.service === service);
    if (!row) {
      addCheck(checks, 'FAIL', 'critical', `Integrity: ${service}`, 'Missing from response');
      continue;
    }

    if (!allowedStatuses.has(row.status)) {
      addCheck(
        checks,
        'FAIL',
        'critical',
        `Integrity: ${service}`,
        `Unexpected status ${row.status} (${truncate(row.details)})`,
      );
      continue;
    }

    addCheck(checks, 'PASS', 'critical', `Integrity: ${service}`, truncate(row.details));
  }

  const elevenlabsRow = results.find((item) => item.service === 'ElevenLabs API');
  if (!communicationsEnabled) {
    if (!elevenlabsRow) {
      addCheck(checks, 'WARN', 'warning', 'Integrity: ElevenLabs API', 'Missing from response while disabled');
      return;
    }
    if (elevenlabsRow.status === 'SKIPPED') {
      addCheck(
        checks,
        'PASS',
        'critical',
        'Integrity: ElevenLabs API',
        'Skipped as expected (ENABLE_TWILIO_ELEVENLABS=false)',
      );
      return;
    }
    addCheck(
      checks,
      'WARN',
      'warning',
      'Integrity: ElevenLabs API',
      `Unexpected status while disabled: ${elevenlabsRow.status} (${truncate(elevenlabsRow.details)})`,
    );
    return;
  }

  if (hasElevenLabsKey) {
    if (!elevenlabsRow) {
      addCheck(checks, 'FAIL', 'critical', 'Integrity: ElevenLabs API', 'Missing from response');
      return;
    }
    if (!new Set(['ONLINE', 'LOW_CREDITS']).has(elevenlabsRow.status)) {
      addCheck(
        checks,
        'FAIL',
        'critical',
        'Integrity: ElevenLabs API',
        `Unexpected status ${elevenlabsRow.status} (${truncate(elevenlabsRow.details)})`,
      );
      return;
    }
    addCheck(checks, 'PASS', 'critical', 'Integrity: ElevenLabs API', truncate(elevenlabsRow.details));
    return;
  }

  if (elevenlabsRow?.status === 'SKIPPED') {
    addCheck(
      checks,
      'FAIL',
      'critical',
      'Integrity: ElevenLabs API',
      'Communications enabled but ELEVENLABS_API_KEY not set',
    );
  }
}

async function checkRecentAuthErrors(checks, supabaseUrl, serviceRoleKey) {
  if (!serviceRoleKey) {
    addCheck(
      checks,
      'WARN',
      'warning',
      'Auth failure review (integration_logs)',
      'SUPABASE_SERVICE_ROLE_KEY missing; log audit skipped',
    );
    return;
  }

  const logsUrl = `${supabaseUrl}/rest/v1/integration_logs?select=provider,status,message_safe,payload_ref,created_at&order=created_at.desc&limit=100`;
  const logsResp = await fetchJson(logsUrl, {
    method: 'GET',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
  });

  if (!logsResp.ok || !Array.isArray(logsResp.json)) {
    addCheck(
      checks,
      'WARN',
      'warning',
      'Auth failure review (integration_logs)',
      logsResp.error ? `Query failed (${logsResp.error})` : `Query failed (status ${logsResp.status})`,
    );
    return;
  }

  const recentAuthIssues = logsResp.json.filter((entry) => {
    const payloadRefText =
      entry.payload_ref && typeof entry.payload_ref === 'object'
        ? JSON.stringify(entry.payload_ref)
        : String(entry.payload_ref || '');
    const blob = `${entry.status || ''} ${entry.message_safe || ''} ${payloadRefText}`;
    return AUTH_ERROR_PATTERN.test(blob);
  });

  if (recentAuthIssues.length > 0) {
    addCheck(
      checks,
      'WARN',
      'warning',
      'Auth failure review (integration_logs)',
      `${recentAuthIssues.length} entries with auth-like errors in latest 100 rows`,
    );
    return;
  }

  addCheck(checks, 'PASS', 'warning', 'Auth failure review (integration_logs)', 'No auth-like errors found');
}

function printSummary(checks) {
  console.log('\nPost-rotation validation summary');
  for (const check of checks) {
    console.log(`[${check.status}] ${check.name} :: ${check.details}`);
  }
}

async function main() {
  const checks = [];
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
  const anonKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || '';
  const hasElevenLabsKey = Boolean(env.ELEVENLABS_API_KEY);
  const communicationsEnabled = String(env.ENABLE_TWILIO_ELEVENLABS || '').toLowerCase() === 'true';

  if (!supabaseUrl) {
    addCheck(checks, 'FAIL', 'critical', 'Environment', 'Missing SUPABASE_URL/VITE_SUPABASE_URL');
    printSummary(checks);
    process.exit(1);
  }
  if (!anonKey) {
    addCheck(checks, 'FAIL', 'critical', 'Environment', 'Missing SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY');
    printSummary(checks);
    process.exit(1);
  }

  const urlRef = getProjectRefFromUrl(supabaseUrl);
  if (!urlRef) {
    addCheck(checks, 'FAIL', 'critical', 'Environment URL format', `Invalid Supabase URL format: ${supabaseUrl}`);
  } else if (fs.existsSync(STAGING_REF_FILE)) {
    const expectedRef = fs.readFileSync(STAGING_REF_FILE, 'utf8').trim();
    if (urlRef !== expectedRef) {
      addCheck(
        checks,
        'FAIL',
        'critical',
        'Target environment guardrail',
        `.env local ref (${urlRef}) does not match linked ref (${expectedRef})`,
      );
    } else {
      addCheck(checks, 'PASS', 'critical', 'Target environment guardrail', `Ref match: ${urlRef}`);
    }
  } else {
    addCheck(
      checks,
      'WARN',
      'warning',
      'Target environment guardrail',
      'supabase/.temp/project-ref not found; environment match not enforced',
    );
  }

  runSecretScan(checks);

  const dbResp = await fetchJson(`${supabaseUrl}/rest/v1/leads?select=id&limit=1`, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });

  if (!dbResp.ok) {
    addCheck(
      checks,
      'FAIL',
      'critical',
      'Supabase REST health',
      dbResp.error
        ? `request failed (${truncate(dbResp.error)})`
        : `status ${dbResp.status} (${truncate(dbResp.text || JSON.stringify(dbResp.json))})`,
    );
  } else {
    addCheck(checks, 'PASS', 'critical', 'Supabase REST health', `status ${dbResp.status}`);
  }

  const integrityResp = await fetchJson(`${supabaseUrl}/functions/v1/system_integrity`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'x-correlation-id': `post-rotation-${Date.now()}`,
    },
    body: JSON.stringify({ source: 'post_rotation_validation' }),
  }, 30000);

  if (!integrityResp.ok || !integrityResp.json || !Array.isArray(integrityResp.json.results)) {
    addCheck(
      checks,
      'FAIL',
      'critical',
      'System integrity function',
      integrityResp.error
        ? `request failed (${truncate(integrityResp.error)})`
        : `status ${integrityResp.status} (${truncate(integrityResp.text || JSON.stringify(integrityResp.json))})`,
    );
  } else {
    addCheck(checks, 'PASS', 'critical', 'System integrity function', `status ${integrityResp.status}`);
    evaluateIntegrityServices(checks, integrityResp.json.results, hasElevenLabsKey, communicationsEnabled);
  }

  await checkRecentAuthErrors(checks, supabaseUrl, serviceRoleKey);

  printSummary(checks);

  const hasCriticalFailure = checks.some((check) => check.level === 'critical' && check.status === 'FAIL');
  const hasWarnings = checks.some((check) => check.status === 'WARN');

  if (hasCriticalFailure || (STRICT && hasWarnings)) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Post-rotation validator failed unexpectedly:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});
