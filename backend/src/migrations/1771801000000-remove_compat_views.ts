import { MigrationInterface, QueryRunner } from 'typeorm';
import { readFileSync } from 'fs';
import { resolve } from 'path';

export class RemoveCompatViews1771801000000 implements MigrationInterface {
  name = 'RemoveCompatViews1771801000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop compatibility views used during transition. Idempotent and tolerant.
    const views = ['mesa', 'producto', 'pedido', 'item_pedido', 'usuario'];
    for (const v of views) {
      try {
        await queryRunner.query(`DROP VIEW IF EXISTS \`${v}\``);
      } catch (err: any) {
        const msg = String(err && err.message ? err.message : err);
        if (msg.includes('does not exist') || msg.includes('Unknown table') || msg.includes('ER_SP_DOES_NOT_EXIST')) {
          continue;
        }
        throw err;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Recreate views by executing the compat_views.sql file (statement-by-statement)
    const sqlPath = resolve(__dirname, '../../../infra/ddls/compat_views.sql');
    const sql = readFileSync(sqlPath, 'utf8');
    const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
    for (const stmt of stmts) {
      try {
        await queryRunner.query(stmt);
      } catch (err: any) {
        const msg = String(err && err.message ? err.message : err);
        // Ignore errors about existing objects when recreating during rollback
        if (msg.includes('already exists') || msg.includes('Duplicate key name') || msg.includes('Duplicate column name')) {
          continue;
        }
        throw err;
      }
    }
  }
}

// Note: no default export to avoid duplicate migration registration
