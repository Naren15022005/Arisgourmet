import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompatViews1771803000000 implements MigrationInterface {
  name = 'CreateCompatViews1771803000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create view `roles` -> underlying table `role`
    const hasRoleTable = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='role'");
    const hasRolesView = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.VIEWS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles'");
    if (hasRoleTable && hasRoleTable[0].c > 0 && (!hasRolesView || hasRolesView[0].c === 0)) {
      await queryRunner.query(`CREATE VIEW roles AS SELECT id, nombre FROM role`);
    }

    // Create view `productos` -> underlying table `producto` (map precio -> precio_cents)
    const hasProductoTable = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='producto'");
    const hasProductosView = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.VIEWS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos'");
    if (hasProductoTable && hasProductoTable[0].c > 0 && (!hasProductosView || hasProductosView[0].c === 0)) {
      await queryRunner.query(`CREATE VIEW productos AS SELECT id, nombre, descripcion, CAST(ROUND(precio * 100) AS UNSIGNED) AS precio_cents, disponible, tiempo_base_minutos, restaurante_id, created_at, updated_at FROM producto`);
    }

    // Create view `mesas` -> underlying table `mesa` (map codigo_qr -> codigo)
    const hasMesaTable = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='mesa'");
    const hasMesasView = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.VIEWS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='mesas'");
    if (hasMesaTable && hasMesaTable[0].c > 0 && (!hasMesasView || hasMesasView[0].c === 0)) {
      await queryRunner.query(`CREATE VIEW mesas AS SELECT id, restaurante_id, codigo_qr AS codigo, NULL AS nombre, estado, NULL AS metadata, created_at, updated_at FROM mesa`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop views if they exist
    await queryRunner.query(`DROP VIEW IF EXISTS mesas`);
    await queryRunner.query(`DROP VIEW IF EXISTS productos`);
    await queryRunner.query(`DROP VIEW IF EXISTS roles`);
  }
}
