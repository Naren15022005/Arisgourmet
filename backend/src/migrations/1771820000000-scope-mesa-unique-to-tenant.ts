import { MigrationInterface, QueryRunner } from 'typeorm';

export class ScopeMesaUniqueToTenant1771820000000 implements MigrationInterface {
  name = 'ScopeMesaUniqueToTenant1771820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // 1. Eliminar la restricción UNIQUE global previa sobre codigo_qr si existe
      await queryRunner.query(`
        ALTER TABLE mesa DROP INDEX IDX_mesa_codigo_qr;
      `);
    } catch (err: any) {
      const msg = String(err?.message || err).toLowerCase();
      if (!msg.includes("check that column/key exists") && !msg.includes("can't drop")) {
        console.warn('[migration] Notice dropping IDX_mesa_codigo_qr:', msg);
      }
    }

    try {
      // 2. Agregar índice UNIQUE compuesto por (restaurante_id, codigo_qr)
      await queryRunner.query(`
        ALTER TABLE mesa ADD UNIQUE KEY IDX_mesa_restaurante_codigo (restaurante_id, codigo_qr);
      `);
    } catch (err: any) {
      const msg = String(err?.message || err).toLowerCase();
      if (!msg.includes('duplicate key name')) {
        throw err;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE mesa DROP INDEX IDX_mesa_restaurante_codigo;`);
    } catch {
      // ignore
    }
    try {
      await queryRunner.query(`ALTER TABLE mesa ADD UNIQUE KEY IDX_mesa_codigo_qr (codigo_qr);`);
    } catch {
      // ignore
    }
  }
}
