"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveCompatViews1771801000000 = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class RemoveCompatViews1771801000000 {
    constructor() {
        this.name = 'RemoveCompatViews1771801000000';
    }
    async up(queryRunner) {
        // Drop compatibility views used during transition. Idempotent and tolerant.
        const views = ['mesa', 'producto', 'pedido', 'item_pedido', 'usuario'];
        for (const v of views) {
            try {
                await queryRunner.query(`DROP VIEW IF EXISTS \`${v}\``);
            }
            catch (err) {
                const msg = String(err && err.message ? err.message : err);
                if (msg.includes('does not exist') || msg.includes('Unknown table') || msg.includes('ER_SP_DOES_NOT_EXIST')) {
                    continue;
                }
                throw err;
            }
        }
    }
    async down(queryRunner) {
        // Recreate views by executing the compat_views.sql file (statement-by-statement)
        const sqlPath = (0, path_1.resolve)(__dirname, '../../../infra/ddls/compat_views.sql');
        const sql = (0, fs_1.readFileSync)(sqlPath, 'utf8');
        const stmts = sql.split(/;\s*\n/).map(s => s.trim()).filter(Boolean);
        for (const stmt of stmts) {
            try {
                await queryRunner.query(stmt);
            }
            catch (err) {
                const msg = String(err && err.message ? err.message : err);
                // Ignore errors about existing objects when recreating during rollback
                if (msg.includes('already exists') || msg.includes('Duplicate key name') || msg.includes('Duplicate column name')) {
                    continue;
                }
                throw err;
            }
        }
    }
}
exports.RemoveCompatViews1771801000000 = RemoveCompatViews1771801000000;
// Note: no default export to avoid duplicate migration registration
//# sourceMappingURL=1771801000000-remove_compat_views.js.map