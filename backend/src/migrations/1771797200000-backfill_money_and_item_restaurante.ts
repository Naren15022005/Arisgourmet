import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillMoneyAndItemRestaurante1771797200000 implements MigrationInterface {
  name = 'BackfillMoneyAndItemRestaurante1771797200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Canonical schema stores money as decimal (`producto.precio`, `item_pedido.precio_unitario`)
    // and tenant reference as varchar UUID-like values. Legacy backfill is deprecated.
    await queryRunner.query('SELECT 1');
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Do not drop columns automatically in down to avoid data loss.
    throw new Error('Irreversible migration');
  }
}
