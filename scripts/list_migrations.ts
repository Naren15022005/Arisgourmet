import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: 'infra/.env' });
const { AppDataSource } = require('../backend/src/data-source');

(async () => {
  try {
    await AppDataSource.initialize();
    const res = await AppDataSource.query('SELECT * FROM migrations');
    console.log('migrations table rows:', res);
    await AppDataSource.destroy();
  } catch (err) {
    console.error('Error listing migrations:', err && err.stack ? err.stack : err);
    process.exitCode = 2;
  }
})();
