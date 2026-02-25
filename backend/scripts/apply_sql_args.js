const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i+1];
      args[key] = val;
      i++;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();
  const user = args.user;
  const pass = args.pass;
  const host = args.host || 'localhost';
  const port = args.port || '3306';
  const db = args.db || 'arisgourmet';
  const sqlPath = args._sql || args.sql || process.argv[process.argv.length-1];

  if (!user || !pass) {
    console.error('Missing --user or --pass');
    process.exit(2);
  }
  if (!sqlPath || !fs.existsSync(sqlPath)) {
    console.error('Missing or invalid SQL file path:', sqlPath);
    process.exit(2);
  }

  const sql = fs.readFileSync(path.resolve(sqlPath), 'utf8');
  const connStr = `mysql://${user}:${pass}@${host}:${port}/${db}`;
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
    await conn.query(sql);
    console.log('DDL executed successfully');
  } catch (e) {
    console.error('Query error:', e.message);
    process.exitCode = 1;
  } finally {
    if (conn) await conn.end();
  }
}

main();
