// Script plantilla: extrae metadatos básicos desde information_schema y produce JSON
// Uso: `node -r ts-node/register scripts/schema_audit.ts` (requiere mysql2 y ts-node)
import { createPool } from 'mysql2/promise';
import { writeFileSync } from 'fs';

const host = process.env.DB_HOST || 'localhost';
const port = Number(process.env.DB_PORT || '3306');
const user = process.env.DB_USER || 'aris_user';
const password = process.env.DB_PASSWORD || 's3cr3t';
const database = process.env.DB_NAME || 'arisgourmet';

async function run() {
  const pool = createPool({ host, port, user, password, database, connectionLimit: 2 });
  try {
    const [tables] = await pool.query(
      `SELECT TABLE_NAME, TABLE_TYPE FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [database],
    );

    const [columns] = await pool.query(
      `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? ORDER BY TABLE_NAME, ORDINAL_POSITION`,
      [database],
    );

    const [keys] = await pool.query(
      `SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
      [database],
    );

    const report = { generated_at: new Date().toISOString(), database, tables, columns, keys } as any;
    const out = `infra/schema_audit/schema-audit-${Date.now()}.json`;
    writeFileSync(out, JSON.stringify(report, null, 2));
    console.log('Report written to', out);
  } finally {
    await pool.end();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
