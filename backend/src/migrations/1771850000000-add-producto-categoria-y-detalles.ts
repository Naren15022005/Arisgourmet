import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddProductoCategoriaYDetalles1771850000000 implements MigrationInterface {
  name = 'AddProductoCategoriaYDetalles1771850000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Agregar columna 'categoria' si no existe
    const hasCategoria = await queryRunner.hasColumn('producto', 'categoria');
    if (!hasCategoria) {
      await queryRunner.query(
        "ALTER TABLE `producto` ADD COLUMN `categoria` VARCHAR(50) NOT NULL DEFAULT 'plato_fuerte'",
      );
    }

    // 2. Agregar columna 'detalles_json' si no existe
    const hasDetalles = await queryRunner.hasColumn('producto', 'detalles_json');
    if (!hasDetalles) {
      await queryRunner.query(
        'ALTER TABLE `producto` ADD COLUMN `detalles_json` TEXT NULL',
      );
    }

    // 3. Categorizar los productos existentes según su nombre
    await queryRunner.query(`
      UPDATE producto SET categoria = 'plato_fuerte'
      WHERE nombre IN ('Ceviche Clásico', 'Lomo Saltado Gourmet', 'Risotto de Hongos Silvestres', 'Salmón a la Plancha con Espárragos')
    `);

    await queryRunner.query(`
      UPDATE producto SET categoria = 'extra'
      WHERE nombre IN ('Papas Rústicas con Alioli de Romero', 'Ensalada Caprese con Reducción Balsámica')
    `);

    await queryRunner.query(`
      UPDATE producto SET categoria = 'bebida'
      WHERE nombre IN ('Limonada de Hierbabuena y Jengibre')
    `);

    await queryRunner.query(`
      UPDATE producto SET categoria = 'postre'
      WHERE nombre IN ('Tarta de Queso con Frutos Rojos')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasDetalles = await queryRunner.hasColumn('producto', 'detalles_json');
    if (hasDetalles) {
      await queryRunner.query('ALTER TABLE `producto` DROP COLUMN `detalles_json`');
    }

    const hasCategoria = await queryRunner.hasColumn('producto', 'categoria');
    if (hasCategoria) {
      await queryRunner.query('ALTER TABLE `producto` DROP COLUMN `categoria`');
    }
  }
}
