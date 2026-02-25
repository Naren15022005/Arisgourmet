const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function main() {
  const connStr = process.argv[2] || process.env.DATABASE_URL;
  const sqlPath = process.argv[3];
  if (!connStr) {
    console.error('Usage: node run_sql_url.js <connectionString> <sqlFilePath>');
    process.exit(2);
  }
  if (!sqlPath) {
    console.error('Missing SQL file path');
    process.exit(2);
  }

  const sql = fs.readFileSync(path.resolve(sqlPath), 'utf8');

  console.error('Connecting using connection string (redacted user:pass)');
  let conn;
  try {
    conn = await mysql.createConnection({ uri: connStr, multipleStatements: true });
  } catch (e) {
    console.error('Connection error:', e.message);
    process.exitCode = 1;
    return;
  }

  try {
    const [results] = await conn.query(sql);
    console.log('SQL executed. Output:');
    if (Array.isArray(results)) {
      try { console.log(JSON.stringify(results, null, 2)); } catch (e) { console.log(results); }
    } else {
      console.log(JSON.stringify(results, null, 2));
    }
  } catch (e) {
    console.error('Query error:', e.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
}

main();
