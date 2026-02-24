import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHistorialPedidoFk1771810002000 implements MigrationInterface {
  name = 'AddHistorialPedidoFk1771810002000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`
        ALTER TABLE historial_estado_pedido
        ADD CONSTRAINT FK_historial_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE;
      `);
    } catch (err: any) {
      const msg = String(err && err.message ? err.message : err);
      if (msg.toLowerCase().includes('denied') || msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('access denied') || msg.toLowerCase().includes("doesn't exist")) {
        // Skip if permissions missing or referenced table not present yet
        // eslint-disable-next-line no-console
        console.warn('Skipping adding FK FK_historial_pedido due to:', msg);
        return;
      }
      throw err;
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    try {
      await queryRunner.query(`ALTER TABLE historial_estado_pedido DROP FOREIGN KEY FK_historial_pedido;`);
    } catch (err) {
      // ignore
    }
  }
}
