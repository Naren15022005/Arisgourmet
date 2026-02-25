import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';

function findLatestReport() {
  const dir = resolve(__dirname, '../infra/schema_audit');
  const files = readdirSync(dir).filter((f) => f.startsWith('schema-audit-') && f.endsWith('.json'));
  if (files.length === 0) throw new Error('No schema-audit JSON files found in infra/schema_audit');
  files.sort();
  return resolve(dir, files[files.length - 1]);
}

function groupColumns(columns: any[]) {
  const map: Record<string, any[]> = {};
  for (const c of columns) {
    if (!map[c.TABLE_NAME]) map[c.TABLE_NAME] = [];
    map[c.TABLE_NAME].push(c);
  }
  return map;
}

function sanitizeName(n: string) {
  return n;
}

function toMd(reportPath: string, report: any) {
  const colsByTable = groupColumns(report.columns);
  let md = `# Borrador de esquema canónico (fuente: DB)\n\n`;
  md += `Generado: ${new Date().toISOString()}\n\n`;
  md += `> Nota: Este borrador asume que la base de datos actual es la fuente canónica. Revisar antes de usar para migraciones.\n\n`;

  for (const t of report.tables) {
    const name = t.TABLE_NAME;
    md += `## Tabla: ${sanitizeName(name)} (${t.TABLE_TYPE})\n\n`;
    const cols = colsByTable[name] || [];
    if (cols.length === 0) {
      md += '_Sin columnas detectadas._\n\n';
      continue;
    }
    md += '| Columna | Type | Nullable | Default |\n|---|---:|---:|---|\n';
    for (const c of cols) {
      md += `| ${c.COLUMN_NAME} | ${c.COLUMN_TYPE} | ${c.IS_NULLABLE} | ${String(c.COLUMN_DEFAULT || '')} |\n`;
    }
    md += '\n';
  }
  return md;
}

async function run() {
  const reportPath = findLatestReport();
  const raw = readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw);
  const md = toMd(reportPath, report);
  const out = resolve(__dirname, '../infra/schema_audit/canonical-schema-draft.md');
  writeFileSync(out, md);
  console.log('Wrote canonical schema draft to', out);
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
