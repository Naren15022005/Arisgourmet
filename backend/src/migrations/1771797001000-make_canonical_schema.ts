import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export class MakeCanonicalSchema1771797001000 implements MigrationInterface {
  name = 'MakeCanonicalSchema1771797001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const sqlPath = resolve(__dirname, '../../../infra/ddls/core_schema.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    // Execute statements one by one to tolerate existing indexes/objects.
    const stmts = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
    for (const stmt of stmts) {
      try {
        await queryRunner.query(stmt);
      } catch (err: any) {
        const msg = String(err && err.message ? err.message : err);
        // Ignore duplicate index/key errors and warnings about existing objects.
        if (msg.includes('Duplicate key name') || msg.includes('already exists') || msg.includes('Duplicate column name')) {
          // continue
          continue;
        }
        throw err;
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error('Down migration is intentionally not implemented for canonical schema migration');
  }
}

// Note: no default export to avoid duplicate migration class registration
