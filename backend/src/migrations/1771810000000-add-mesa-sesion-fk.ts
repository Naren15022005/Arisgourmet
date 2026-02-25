import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMesaSesionFk1771810000000 implements MigrationInterface {
  name = 'AddMesaSesionFk1771810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Try to add FK constraint after mesa table is guaranteed to exist.
    // If the DB user lacks ALTER privileges, don't fail the whole migration.
    try {
      await queryRunner.query(`
        ALTER TABLE mesa_sesion
        ADD CONSTRAINT FK_mesa_sesion_mesa FOREIGN KEY (mesa_id) REFERENCES mesa(id) ON DELETE CASCADE;
      `);
    } catch (err: any) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('access denied')) {
        // Log and continue — user may not have privileges on CI or local DB
        // eslint-disable-next-line no-console
        console.warn('Skipping adding FK FK_mesa_sesion_mesa due to insufficient privileges:', msg);
        return;
      }
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE mesa_sesion DROP FOREIGN KEY FK_mesa_sesion_mesa;
    `);
  }
}
