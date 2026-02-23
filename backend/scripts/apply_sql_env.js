const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const user = process.env.DB_ADMIN_USER || process.env.DB_USER;
  const pass = process.env.DB_ADMIN_PASS || process.env.DB_PASSWORD;
  const host = process.env.DB_HOST || 'localhost';
  const port = process.env.DB_PORT || '3306';
  const db = process.env.DB_NAME || 'arisgourmet';
  if (!user || !pass) {
    console.error('Missing DB_ADMIN_USER or DB_ADMIN_PASS environment variables');
    process.exit(2);
  }

  const connStr = `mysql://${user}:${pass}@${host}:${port}/${db}`;
  const sqlPath = process.argv[2] || path.resolve('infra/ddls/create_distributed_tables.sql');
  const sql = fs.readFileSync(path.resolve(sqlPath), 'utf8');

  console.error('Connecting using connection string (redacted user:pass)');
  const conn = await mysql.createConnection({ uri: connStr, multipleStatements: true });
  try {
    await conn.query(sql);
    console.log('DDL executed successfully');
  } catch (e) {
    console.error('Query error:', e.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
