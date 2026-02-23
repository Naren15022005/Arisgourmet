import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

export class InitialMigration00011760000000000 implements MigrationInterface {
  name = 'InitialMigration00011760000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const candidateCwd = resolve(process.cwd(), 'infra', 'ddls', 'core_schema.sql');
    const candidateDirname = resolve(__dirname, '../../../infra/ddls/core_schema.sql');
    const sqlPath = existsSync(candidateCwd) ? candidateCwd : candidateDirname;
    const sql = readFileSync(sqlPath, 'utf8');

    const cleaned = sql
      .split(/\r?\n/)
      .filter((line) => {
        const l = line.trim().toUpperCase();
        return !(l.startsWith('CREATE DATABASE') || l.startsWith('USE '));
      })
      .join('\n');

    const statements = cleaned
      .split(/;\s*\n/)
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      try {
        await queryRunner.query(stmt);
      } catch (err: any) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('already exists') || msg.includes('Duplicate key name') || msg.includes('Duplicate column name')) {
          continue;
        }
        throw err;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropping everything is destructive; for safety only drop outbox/refresh for down.
    await queryRunner.query('DROP TABLE IF EXISTS outbox;');
    await queryRunner.query('DROP TABLE IF EXISTS refresh_tokens;');
  }
}
