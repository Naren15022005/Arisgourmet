import { createConnection } from 'mysql2/promise';

async function main() {
  try {
    const databaseUrl = process.env.DATABASE_URL;
    let config: any = {};
    if (databaseUrl) {
      try {
        const u = new URL(databaseUrl);
        config.host = u.hostname;
        config.port = Number(u.port || 3306);
        config.user = u.username;
        config.password = u.password;
        config.database = u.pathname.replace(/^\//, '');
      } catch (e) {
        // ignore
      }
    }

    // override with explicit env vars if present
    if (process.env.DB_HOST) config.host = process.env.DB_HOST;
    if (process.env.DB_PORT) config.port = Number(process.env.DB_PORT);
    if (process.env.DB_USERNAME) config.user = process.env.DB_USERNAME;
    if (process.env.DB_PASSWORD) config.password = process.env.DB_PASSWORD;
    if (process.env.DB_DATABASE) config.database = process.env.DB_DATABASE;

    if (!config.user) throw new Error('DB user not found in env (DATABASE_URL or DB_USERNAME)');
    if (!config.password) throw new Error('DB password not found in env (DATABASE_URL or DB_PASSWORD)');
    if (!config.database) throw new Error('DB database not found in env (DATABASE_URL or DB_DATABASE)');

    console.log('Connecting to MySQL', { host: config.host, port: config.port, database: config.database, user: config.user });
    const conn = await createConnection({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.user,
      password: config.password,
      database: config.database,
      multipleStatements: true,
    });

    const views = ['mesa', 'producto', 'pedido', 'item_pedido', 'usuario'];
    const stmt = `DROP VIEW IF EXISTS ${views.map(v => `\`${v}\``).join(', ')};`;
    console.log('Executing:', stmt);
    const [res] = await conn.query(stmt);
    console.log('Done:', res);
    await conn.end();
    process.exit(0);
  } catch (err: any) {
    console.error('Error dropping compat views:', err && err.message ? err.message : err);
    process.exit(2);
  }
}

main();
