import { MigrationInterface, QueryRunner } from 'typeorm';

export class EnsureOutboxAndRefreshTokens1771804000000 implements MigrationInterface {
  name = 'EnsureOutboxAndRefreshTokens1771804000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
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

  public async down(_queryRunner: QueryRunner): Promise<void> {
    throw new Error('Irreversible migration');
  }
}
