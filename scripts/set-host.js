const mysql = require('mysql2/promise');

(async () => {
  try {
    const c = await mysql.createConnection({ host: 'mysql', user: 'ag_user', password: 'ag_password', database: 'arisgourmet' });
    await c.execute("UPDATE usuario SET role='host' WHERE email='dev@local'");
    const [rows] = await c.execute("SELECT id,email,role FROM usuario WHERE email='dev@local'");
    console.log('updated:', JSON.stringify(rows, null, 2));
    await c.end();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
