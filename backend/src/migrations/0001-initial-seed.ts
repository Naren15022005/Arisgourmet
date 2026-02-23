import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSeed1676980000000 implements MigrationInterface {
  name = 'InitialSeed1676980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Deterministic minimal seed for canonical singular schema.
    const restId = '00000000-0000-0000-0000-000000000001';
    await queryRunner.query(
      `INSERT INTO restaurante (id, nombre)
       SELECT ?, 'Default Restaurante'
       WHERE NOT EXISTS (SELECT 1 FROM restaurante WHERE id = ?)`,
      [restId, restId],
    );

    await queryRunner.query(
      `INSERT INTO mesa (id, restaurante_id, codigo_qr, estado)
       SELECT '00000000-0000-0000-0000-000000000011', ?, 'MESA-1', 'libre'
       WHERE NOT EXISTS (SELECT 1 FROM mesa WHERE id = '00000000-0000-0000-0000-000000000011')`,
      [restId],
    );
    await queryRunner.query(
      `INSERT INTO mesa (id, restaurante_id, codigo_qr, estado)
       SELECT '00000000-0000-0000-0000-000000000012', ?, 'MESA-2', 'libre'
       WHERE NOT EXISTS (SELECT 1 FROM mesa WHERE id = '00000000-0000-0000-0000-000000000012')`,
      [restId],
    );

    await queryRunner.query(
      `INSERT INTO producto (id, restaurante_id, nombre, descripcion, precio, disponible)
       SELECT '00000000-0000-0000-0000-000000000021', ?, 'Café', 'Café negro', 1.50, 1
       WHERE NOT EXISTS (SELECT 1 FROM producto WHERE id = '00000000-0000-0000-0000-000000000021')`,
      [restId],
    );
    await queryRunner.query(
      `INSERT INTO producto (id, restaurante_id, nombre, descripcion, precio, disponible)
       SELECT '00000000-0000-0000-0000-000000000022', ?, 'Ensalada', 'Ensalada mixta', 4.50, 1
       WHERE NOT EXISTS (SELECT 1 FROM producto WHERE id = '00000000-0000-0000-0000-000000000022')`,
      [restId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM producto WHERE id IN ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022')`);
    await queryRunner.query(`DELETE FROM mesa WHERE id IN ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000012')`);
    await queryRunner.query(`DELETE FROM restaurante WHERE id = '00000000-0000-0000-0000-000000000001'`);
  }
}
