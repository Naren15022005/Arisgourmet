import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { AppDataSource } from '../backend/src/data-source';

function findLatestReport() {
  const dir = resolve(__dirname, '../infra/schema_audit');
  const files = readdirSync(dir).filter((f) => f.startsWith('schema-audit-') && f.endsWith('.json'));
  if (files.length === 0) throw new Error('No schema-audit JSON files found in infra/schema_audit');
  files.sort();
  return resolve(dir, files[files.length - 1]);
}

function buildDbIndex(report: any) {
  const tables = new Map<string, any[]>();
  for (const t of report.tables) {
    tables.set(t.TABLE_NAME, []);
  }
  for (const c of report.columns) {
    const arr = tables.get(c.TABLE_NAME) || [];
    arr.push(c);
    tables.set(c.TABLE_NAME, arr);
  }
  return tables;
}

async function run() {
  const reportPath = findLatestReport();
  console.log('Using DB report:', reportPath);
  const raw = readFileSync(reportPath, 'utf8');
  const report = JSON.parse(raw);
  const db = buildDbIndex(report);

  await AppDataSource.initialize();
  const entities = AppDataSource.entityMetadatas;

  const diffs: string[] = [];

  for (const em of entities) {
    const table = em.tableName;
    if (!db.has(table)) {
      diffs.push(`TABLE MISSING IN DB: ${table}`);
      continue;
    }
    const dbCols = db.get(table) || [];
    const dbColNames = new Set(dbCols.map((c: any) => c.COLUMN_NAME));

    for (const col of em.columns) {
      const colName = col.databaseName || col.propertyName;
      if (!dbColNames.has(colName)) {
        diffs.push(`COLUMN MISSING: ${table}.${colName} (ORM expects type=${String(col.type)})`);
        continue;
      }
      const dbCol = dbCols.find((c: any) => c.COLUMN_NAME === colName);
      const ormType = String(col.type);
      const dbType = dbCol.COLUMN_TYPE;
      if (!dbType.includes(ormType) && !ormType.includes(dbType)) {
        diffs.push(`TYPE MISMATCH: ${table}.${colName} ORM=${ormType} DB=${dbType}`);
      }
      // nullable check
      const ormNullable = !!col.isNullable;
      const dbNullable = dbCol.IS_NULLABLE === 'YES';
      if (ormNullable !== dbNullable) {
        diffs.push(`NULLABLE MISMATCH: ${table}.${colName} ORM=${ormNullable} DB=${dbNullable}`);
      }
    }
  }

  const outPath = resolve(__dirname, '../infra/schema_audit/orm-db-diff-' + Date.now() + '.md');
  const header = `# ORM vs DB Diff Report\nGenerated: ${new Date().toISOString()}\nSource report: ${reportPath}\n\n`;
  const body = diffs.length ? diffs.map((d) => `- ${d}`).join('\n') : 'No differences detected (basic checks).';
  writeFileSync(outPath, header + body);
  console.log('Wrote ORM-DB diff to', outPath);
  await AppDataSource.destroy();
}

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
