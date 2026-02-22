import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSeed1676980000000 implements MigrationInterface {
  name = 'InitialSeed1676980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert some sample mesas
    await queryRunner.query(`INSERT INTO mesa (id, codigo_qr, estado, created_at, updated_at) VALUES 
      (UUID(), 'MESA-1', 'libre', NOW(), NOW()),
      (UUID(), 'MESA-2', 'libre', NOW(), NOW())`);

    // Insert sample productos
    await queryRunner.query(`INSERT INTO producto (id, nombre, descripcion, precio, disponible, tiempo_base_minutos, created_at, updated_at) VALUES 
      (UUID(), 'Café', 'Café negro', 1.50, true, 5, NOW(), NOW()),
      (UUID(), 'Ensalada', 'Ensalada mixta', 4.50, true, 10, NOW(), NOW())`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM producto WHERE nombre IN ('Café','Ensalada')`);
    await queryRunner.query(`DELETE FROM mesa WHERE codigo_qr IN ('MESA-1','MESA-2')`);
  }
}
