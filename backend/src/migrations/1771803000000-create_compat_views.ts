import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompatViews1771803000000 implements MigrationInterface {
  name = 'CreateCompatViews1771803000000';

  public async up(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally no-op: compatibility views are deprecated in canonical schema.
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentionally no-op.
  }
}
