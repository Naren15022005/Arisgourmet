import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMesaCapacidad1771810003000 implements MigrationInterface {
  name = 'AddMesaCapacidad1771810003000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`
        ALTER TABLE mesa ADD COLUMN capacidad INT NOT NULL DEFAULT 4;
      `);
    } catch (err: any) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.includes('Duplicate column name') || msg.toLowerCase().includes('already exists')) {
        return;
      }
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE mesa DROP COLUMN capacidad;`);
    } catch {
      // ignore
    }
  }
}
