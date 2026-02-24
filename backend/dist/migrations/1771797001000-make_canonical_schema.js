"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MakeCanonicalSchema1771797001000 = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class MakeCanonicalSchema1771797001000 {
    constructor() {
        this.name = 'MakeCanonicalSchema1771797001000';
    }
    async up(queryRunner) {
        const sqlPath = (0, path_1.resolve)(__dirname, '../../../infra/ddls/core_schema.sql');
        const sql = (0, fs_1.readFileSync)(sqlPath, 'utf8');
        // Execute statements one by one to tolerate existing indexes/objects.
        const stmts = sql.split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
        for (const stmt of stmts) {
            try {
                await queryRunner.query(stmt);
            }
            catch (err) {
                const msg = String(err && err.message ? err.message : err);
                // Ignore duplicate index/key errors and warnings about existing objects.
                if (msg.includes('Duplicate key name') || msg.includes('already exists') || msg.includes('Duplicate column name')) {
                    // continue
                    continue;
                }
                throw err;
            }
        }
    }
    async down(_queryRunner) {
        throw new Error('Down migration is intentionally not implemented for canonical schema migration');
    }
}
exports.MakeCanonicalSchema1771797001000 = MakeCanonicalSchema1771797001000;
// Note: no default export to avoid duplicate migration class registration
//# sourceMappingURL=1771797001000-make_canonical_schema.js.map