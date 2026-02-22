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
    // Execute the full SQL DDL. AppDataSource is configured with multipleStatements.
    await queryRunner.query(sql);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Dropping everything is destructive; for safety only drop outbox/refresh for down.
    await queryRunner.query('DROP TABLE IF EXISTS outbox;');
    await queryRunner.query('DROP TABLE IF EXISTS refresh_tokens;');
  }
}
