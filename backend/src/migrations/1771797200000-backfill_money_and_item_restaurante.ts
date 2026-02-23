import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMoneyAndItemRestaurante1771797200000 implements MigrationInterface {
  name = 'BackfillMoneyAndItemRestaurante1771797200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // productos.precio_cents: add if missing and backfill from precio (decimal)
    const prodPrecioCol = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='precio_cents'");
    if (!prodPrecioCol || prodPrecioCol[0].c === 0) {
      await queryRunner.query(`ALTER TABLE productos ADD COLUMN precio_cents BIGINT UNSIGNED NOT NULL DEFAULT 0`);
    }
    // Backfill only if legacy 'precio' column exists
    const hasPrecio = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='precio'");
    if (hasPrecio && hasPrecio[0].c > 0) {
      await queryRunner.query(`UPDATE productos SET precio_cents = CAST(ROUND(precio * 100) AS UNSIGNED) WHERE precio IS NOT NULL AND (precio_cents IS NULL OR precio_cents = 0)`);
    }

    // pedido_items.price_cents: add if missing and backfill from precio_unitario (decimal)
    const itemPriceCol = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedido_items' AND COLUMN_NAME='price_cents'");
    if (!itemPriceCol || itemPriceCol[0].c === 0) {
      await queryRunner.query(`ALTER TABLE pedido_items ADD COLUMN price_cents BIGINT UNSIGNED NOT NULL DEFAULT 0`);
    }
    // If precio_unitario exists (legacy decimal), backfill
    const hasPrecioUnitario = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedido_items' AND COLUMN_NAME='precio_unitario'");
    if (hasPrecioUnitario && hasPrecioUnitario[0].c > 0) {
      await queryRunner.query(`UPDATE pedido_items SET price_cents = CAST(ROUND(precio_unitario * 100) AS UNSIGNED) WHERE precio_unitario IS NOT NULL AND (price_cents IS NULL OR price_cents = 0)`);
    }

    // pedido_items.restaurante_id: add if missing and backfill from pedidos
    const itemRestCol = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedido_items' AND COLUMN_NAME='restaurante_id'");
    if (!itemRestCol || itemRestCol[0].c === 0) {
      await queryRunner.query(`ALTER TABLE pedido_items ADD COLUMN restaurante_id BIGINT UNSIGNED NULL`);
    }
    const itemRestExists = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='pedido_items' AND COLUMN_NAME='restaurante_id'");
    if (itemRestExists && itemRestExists[0].c > 0) {
      await queryRunner.query(`UPDATE pedido_items pi JOIN pedidos p ON pi.pedido_id = p.id SET pi.restaurante_id = p.restaurante_id WHERE pi.restaurante_id IS NULL`);
    }

    // productos.restaurante_id: ensure column exists
    const prodRestCol = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='productos' AND COLUMN_NAME='restaurante_id'");
    if (!prodRestCol || prodRestCol[0].c === 0) {
      await queryRunner.query(`ALTER TABLE productos ADD COLUMN restaurante_id BIGINT UNSIGNED NULL`);
    }
    // ensure usuarios email length / other non-destructive adjustments can be handled separately
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Do not drop columns automatically in down to avoid data loss.
    throw new Error('Irreversible migration');
  }
}
