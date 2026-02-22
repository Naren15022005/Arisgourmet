import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSeed1676980000000 implements MigrationInterface {
  name = 'InitialSeed1676980000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Insert a default restaurante and some sample mesas/productos that match the DDL
    await queryRunner.query(`INSERT INTO restaurantes (nombre) VALUES ('Default Restaurante')`);

    // Use the newly created restaurante (assume id=1 on fresh DB)
    await queryRunner.query(`INSERT INTO mesas (restaurante_id, codigo, nombre, estado) VALUES 
      (1, 'MESA-1', 'Mesa 1', 'libre'),
      (1, 'MESA-2', 'Mesa 2', 'libre')`);

    // Insert sample productos with precio in cents and available flag
    await queryRunner.query(`INSERT INTO productos (restaurante_id, nombre, descripcion, precio_cents, disponible) VALUES 
      (1, 'Café', 'Café negro', 150, 1),
      (1, 'Ensalada', 'Ensalada mixta', 450, 1)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM producto WHERE nombre IN ('Café','Ensalada')`);
    await queryRunner.query(`DELETE FROM mesa WHERE codigo_qr IN ('MESA-1','MESA-2')`);
  }
}
