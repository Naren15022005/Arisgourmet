"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InitialMigration00011760000000000 = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
class InitialMigration00011760000000000 {
    constructor() {
        this.name = 'InitialMigration00011760000000000';
    }
    async up(queryRunner) {
        const candidateCwd = (0, path_1.resolve)(process.cwd(), 'infra', 'ddls', 'core_schema.sql');
        const candidateDirname = (0, path_1.resolve)(__dirname, '../../../infra/ddls/core_schema.sql');
        const sqlPath = (0, fs_1.existsSync)(candidateCwd) ? candidateCwd : candidateDirname;
        const sql = (0, fs_1.readFileSync)(sqlPath, 'utf8');
        const cleaned = sql
            .split(/\r?\n/)
            .filter((line) => {
            const l = line.trim().toUpperCase();
            return !(l.startsWith('CREATE DATABASE') || l.startsWith('USE '));
        })
            .join('\n');
        const statements = cleaned
            .split(/;\s*\n/)
            .map((s) => s.trim())
            .filter(Boolean);
        for (const stmt of statements) {
            try {
                await queryRunner.query(stmt);
            }
            catch (err) {
                const msg = String(err && err.message ? err.message : err);
                if (msg.includes('already exists') || msg.includes('Duplicate key name') || msg.includes('Duplicate column name')) {
                    continue;
                }
                throw err;
            }
        }
    }
    async down(queryRunner) {
        // Dropping everything is destructive; for safety only drop outbox/refresh for down.
        await queryRunner.query('DROP TABLE IF EXISTS outbox;');
        await queryRunner.query('DROP TABLE IF EXISTS refresh_tokens;');
    }
}
exports.InitialMigration00011760000000000 = InitialMigration00011760000000000;
//# sourceMappingURL=0001-initial.js.map