import 'reflect-metadata';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const { AppDataSource } = require('../src/data-source');

async function run() {
  try {
    await AppDataSource.initialize();
    const migrations = await AppDataSource.runMigrations();
    console.log('Migrations run:', migrations.map((m: any) => m.name));
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err && (err as any).stack ? (err as any).stack : err);
    process.exit(1);
  }
}

run();
