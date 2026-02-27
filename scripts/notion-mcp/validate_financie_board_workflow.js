import { Client } from '@notionhq/client';

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const DATABASE_ID = process.env.NOTION_FINANCIE_DB_ID || '314d9667-8728-8179-b756-c14040790dd4';

if (!NOTION_API_KEY) {
  console.error('Error: NOTION_API_KEY is required.');
  process.exit(1);
}

const notion = new Client({ auth: NOTION_API_KEY });

const baseRequired = [
  'Objetivo',
  'Motivo',
  'Impacto esperado',
  'Resultado esperado',
  'Beneficios',
  'Modulos afectados',
  'Sistemas afectados',
  'Dependencias',
  'Riesgos',
  'Plan de pruebas',
  'Plan de rollback',
];

const statusRequired = {
  'ready for dev': baseRequired,
  'in progress': [...baseRequired, 'Branch objetivo'],
  'in review': [...baseRequired, 'Evidencia tecnica'],
  'qa / testing': [...baseRequired, 'Evidencia tecnica', 'QA OK'],
  'staging / uat': [...baseRequired, 'Evidencia tecnica', 'Staging DB OK', 'Staging Vercel OK'],
  'ready to deploy': [
    ...baseRequired,
    'Evidencia tecnica',
    'QA OK',
    'Staging DB OK',
    'Staging Vercel OK',
    'Docs OK',
    'Prod impacto revisado',
  ],
  done: [
    ...baseRequired,
    'Evidencia tecnica',
    'QA OK',
    'Staging DB OK',
    'Staging Vercel OK',
    'Docs OK',
    'Prod impacto revisado',
  ],
};

function valuePresent(prop) {
  if (!prop) return false;
  switch (prop.type) {
    case 'title':
      return (prop.title || []).some((x) => (x.plain_text || '').trim().length > 0);
    case 'rich_text':
      return (prop.rich_text || []).some((x) => (x.plain_text || '').trim().length > 0);
    case 'multi_select':
      return (prop.multi_select || []).length > 0;
    case 'select':
      return Boolean(prop.select?.name);
    case 'status':
      return Boolean(prop.status?.name);
    case 'checkbox':
      return prop.checkbox === true;
    case 'date':
      return Boolean(prop.date?.start);
    case 'people':
      return (prop.people || []).length > 0;
    case 'url':
      return Boolean(prop.url);
    default:
      return true;
  }
}

function getStatus(page) {
  const statusProp = page.properties?.Status;
  if (!statusProp) return null;
  if (statusProp.type === 'status') return statusProp.status?.name || null;
  if (statusProp.type === 'select') return statusProp.select?.name || null;
  return null;
}

function getTitle(page) {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') {
      return (prop.title || []).map((x) => x.plain_text).join('');
    }
  }
  return '(Untitled)';
}

async function queryAllPages(databaseId) {
  const all = [];
  let cursor = undefined;
  do {
    const r = await notion.databases.query({
      database_id: databaseId,
      page_size: 100,
      start_cursor: cursor,
    });
    all.push(...r.results);
    cursor = r.has_more ? r.next_cursor : undefined;
  } while (cursor);
  return all;
}

async function main() {
  const pages = await queryAllPages(DATABASE_ID);
  const findings = [];

  for (const page of pages) {
    const status = (getStatus(page) || '').toLowerCase();
    const required = statusRequired[status] || [];
    if (required.length === 0) continue;

    const missing = required.filter((field) => !valuePresent(page.properties?.[field]));
    if (missing.length > 0) {
      findings.push({
        id: page.id,
        title: getTitle(page),
        status,
        missing,
      });
    }
  }

  if (findings.length === 0) {
    console.log('PASS: all tickets satisfy workflow requirements for their status.');
    process.exit(0);
  }

  console.log(`FAIL: ${findings.length} ticket(s) missing required fields.`);
  for (const f of findings) {
    console.log(`- ${f.title} [${f.status}]`);
    console.log(`  id=${f.id}`);
    console.log(`  missing=${f.missing.join(', ')}`);
  }
  process.exit(1);
}

main().catch((error) => {
  console.error('Workflow validator error:', error.body || error.message || error);
  process.exit(1);
});
