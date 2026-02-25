"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnsureOutboxAndRefreshTokens1771804000000 = void 0;
class EnsureOutboxAndRefreshTokens1771804000000 {
    constructor() {
        this.name = 'EnsureOutboxAndRefreshTokens1771804000000';
    }
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        usuario_id VARCHAR(36) NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        revoked BOOLEAN NOT NULL DEFAULT FALSE,
        replaced_by_token_id BIGINT UNSIGNED NULL,
        expires_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY idx_refresh_hash (token_hash),
        INDEX idx_refresh_usuario (usuario_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS outbox (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        aggregate_type VARCHAR(100) NOT NULL,
        aggregate_id VARCHAR(100) NULL,
        event_type VARCHAR(150) NOT NULL,
        payload JSON NULL,
        processed BOOLEAN NOT NULL DEFAULT FALSE,
        attempts INT NOT NULL DEFAULT 0,
        last_error TEXT NULL,
        next_retry_at DATETIME NULL,
        dlq BOOLEAN NOT NULL DEFAULT FALSE,
        dlq_reason TEXT NULL,
        processed_at DATETIME NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_outbox_pending (processed, dlq, next_retry_at, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
    }
    async down(_queryRunner) {
        throw new Error('Irreversible migration');
    }
}
exports.EnsureOutboxAndRefreshTokens1771804000000 = EnsureOutboxAndRefreshTokens1771804000000;
//# sourceMappingURL=1771804000000-ensure_outbox_and_refresh_tokens.js.map