"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackfillMoneyAndItemRestaurante1771797200000 = void 0;
class BackfillMoneyAndItemRestaurante1771797200000 {
    constructor() {
        this.name = 'BackfillMoneyAndItemRestaurante1771797200000';
    }
    async up(queryRunner) {
        // Canonical schema stores money as decimal (`producto.precio`, `item_pedido.precio_unitario`)
        // and tenant reference as varchar UUID-like values. Legacy backfill is deprecated.
        await queryRunner.query('SELECT 1');
    }
    async down(_queryRunner) {
        // Do not drop columns automatically in down to avoid data loss.
        throw new Error('Irreversible migration');
    }
}
exports.BackfillMoneyAndItemRestaurante1771797200000 = BackfillMoneyAndItemRestaurante1771797200000;
//# sourceMappingURL=1771797200000-backfill_money_and_item_restaurante.js.map