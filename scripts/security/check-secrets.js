import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TARGET_DIRS = ['scripts', 'supabase', 'src', '.github'];
const ALLOWED_EXT = new Set(['.js', '.ts', '.tsx', '.sql', '.yml', '.yaml', '.json', '.md']);
const IGNORE_DIRS = new Set(['node_modules', 'dist', '.git', '.next', '.vercel', 'docs/reports']);

const LEGACY_PROD_REF = 'cnkwnynujtyfslafsmug';

const DETECTORS = [
  { name: 'Supabase service-role key literal', pattern: /sb_secret_[A-Za-z0-9._-]+/g },
  { name: 'ElevenLabs key literal', pattern: /sk_[A-Za-z0-9]{20,}/g },
  { name: 'Notion integration key literal', pattern: /ntn_[A-Za-z0-9]{20,}/g },
  { name: 'Hardcoded legacy production Supabase URL', pattern: new RegExp(`https://` + LEGACY_PROD_REF + `\\.supabase\\.co`, 'g') },
];

function shouldIgnoreDir(dirPath) {
  const normalized = dirPath.replace(/\\/g, '/');
  for (const ignore of IGNORE_DIRS) {
    if (normalized.includes(ignore)) return true;
  }
  return false;
}

function walk(dir) {
  if (!fs.existsSync(dir) || shouldIgnoreDir(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(fullPath));
      continue;
    }

    if (!entry.isFile()) continue;

    const ext = path.extname(entry.name).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) continue;
    files.push(fullPath);
  }

  return files;
}

function findLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length;
}

const findings = [];

for (const relDir of TARGET_DIRS) {
  const absDir = path.join(ROOT, relDir);
  const files = walk(absDir);

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');

    for (const detector of DETECTORS) {
      detector.pattern.lastIndex = 0;
      let match;
      while ((match = detector.pattern.exec(content)) !== null) {
        findings.push({
          file: path.relative(ROOT, file),
          line: findLineNumber(content, match.index),
          detector: detector.name,
          snippet: match[0],
        });
      }
    }
  }
}

if (findings.length > 0) {
  console.error('Secret/governance scan failed. Findings:');
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} [${finding.detector}] ${finding.snippet}`);
  }
  process.exit(1);
}

console.log('Secret/governance scan passed.');
