import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddOutboxRetryColumns1771802000000 implements MigrationInterface {
  name = 'AddOutboxRetryColumns1771802000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasAttempts = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='outbox' AND COLUMN_NAME='attempts'");
    if (!hasAttempts || hasAttempts[0].c === 0) {
      await queryRunner.query(`ALTER TABLE outbox ADD COLUMN attempts INT NOT NULL DEFAULT 0`);
    }

    const hasLastError = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='outbox' AND COLUMN_NAME='last_error'");
    if (!hasLastError || hasLastError[0].c === 0) {
      await queryRunner.query(`ALTER TABLE outbox ADD COLUMN last_error TEXT NULL`);
    }

    const hasNextRetry = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='outbox' AND COLUMN_NAME='next_retry_at'");
    if (!hasNextRetry || hasNextRetry[0].c === 0) {
      await queryRunner.query(`ALTER TABLE outbox ADD COLUMN next_retry_at DATETIME NULL`);
    }

    const hasDlq = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='outbox' AND COLUMN_NAME='dlq'");
    if (!hasDlq || hasDlq[0].c === 0) {
      await queryRunner.query(`ALTER TABLE outbox ADD COLUMN dlq BOOLEAN NOT NULL DEFAULT FALSE`);
    }

    const hasDlqReason = await queryRunner.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='outbox' AND COLUMN_NAME='dlq_reason'");
    if (!hasDlqReason || hasDlqReason[0].c === 0) {
      await queryRunner.query(`ALTER TABLE outbox ADD COLUMN dlq_reason TEXT NULL`);
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Avoid dropping columns automatically to prevent data loss
    throw new Error('Irreversible migration');
  }
}
