import 'reflect-metadata';
import * as dotenv from 'dotenv';

// Load infra/.env so data-source picks up DB credentials from infra
dotenv.config({ path: 'infra/.env' });

// Require AppDataSource after dotenv config so environment variables are loaded
const { AppDataSource } = require('../backend/src/data-source');

async function run() {
  try {
    console.log('Initializing AppDataSource with options:', {
      host: process.env.DB_HOST || 'mysql',
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME || 'arisgourmet',
    });
    await AppDataSource.initialize();
    console.log('DataSource initialized');
    console.log('Running migrations...');
    // Run pending TypeORM migrations (do NOT use synchronize in CI/production)
    const migrations = await AppDataSource.runMigrations();
    console.log('Migrations run:', migrations.map((m) => m.name));
    await AppDataSource.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err && err.stack ? err.stack : err);
    process.exit(1);
  }
}

run();
