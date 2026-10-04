import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRestauranteSlug1771830000000 implements MigrationInterface {
  name = 'AddRestauranteSlug1771830000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      // 1. Agregar columna slug si no existe
      await queryRunner.query(`
        ALTER TABLE restaurante ADD COLUMN slug VARCHAR(255) NULL;
      `);
    } catch (err: any) {
      const msg = String(err?.message || err).toLowerCase();
      if (!msg.includes('duplicate column name') && !msg.includes('already exists')) {
        throw err;
      }
    }

    try {
      // 2. Asignar slug semántico a los restaurantes existentes
      await queryRunner.query(`
        UPDATE restaurante
        SET slug = 'arisgourmet'
        WHERE id = '42caa066-52d5-40fa-981e-10a016ced9c5' AND (slug IS NULL OR slug = '');
      `);

      await queryRunner.query(`
        UPDATE restaurante
        SET slug = 'default'
        WHERE id = '00000000-0000-0000-0000-000000000001' AND (slug IS NULL OR slug = '');
      `);

      await queryRunner.query(`
        UPDATE restaurante
        SET slug = 'demo'
        WHERE id = '6c230894-d140-450e-a9e6-e12429f88fe1' AND (slug IS NULL OR slug = '');
      `);

      // Fallback para cualquier otro restaurante sin slug
      await queryRunner.query(`
        UPDATE restaurante
        SET slug = LOWER(REPLACE(REPLACE(nombre, ' ', '-'), '_', '-'))
        WHERE slug IS NULL OR slug = '';
      `);
    } catch (err: any) {
      console.warn('[migration] Notice populating slugs:', err?.message || err);
    }

    try {
      // 3. Agregar restricción UNIQUE al slug
      await queryRunner.query(`
        ALTER TABLE restaurante ADD UNIQUE KEY UQ_restaurante_slug (slug);
      `);
    } catch (err: any) {
      const msg = String(err?.message || err).toLowerCase();
      if (!msg.includes('duplicate key name') && !msg.includes('already exists')) {
        throw err;
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE restaurante DROP INDEX UQ_restaurante_slug;`);
    } catch {
      // ignore
    }
    try {
      await queryRunner.query(`ALTER TABLE restaurante DROP COLUMN slug;`);
    } catch {
      // ignore
    }
  }
}
