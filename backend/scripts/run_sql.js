const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const envPath = path.resolve(__dirname, '../.env');
let fileEnv = {};
try {
  const envRaw = fs.readFileSync(envPath, 'utf8');
  fileEnv = dotenv.parse(envRaw);
} catch (e) {
  // ignore if .env missing
}

async function main() {
  const sql = process.argv[2];
  if (!sql) {
    console.error('Usage: node run_sql.js "<SQL>"');
    process.exit(2);
  }

  const cfg = {
    host: fileEnv.DB_HOST || process.env.DB_HOST || 'localhost',
    port: fileEnv.DB_PORT || process.env.DB_PORT || '3306',
    user: fileEnv.DB_USER || process.env.DB_USER,
    password: fileEnv.DB_PASSWORD || process.env.DB_PASSWORD,
    database: fileEnv.DB_NAME || process.env.DB_NAME,
  };

  console.error('Connecting using:', cfg);

  const conn = await mysql.createConnection({
    host: cfg.host,
    port: Number(cfg.port),
    user: cfg.user,
    password: cfg.password,
    database: cfg.database,
    multipleStatements: false,
  });

  try {
    const [rows] = await conn.query(sql);
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Query error:', err.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

main();
