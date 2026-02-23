-- Privileged changes bundle for arisgourmet
-- Run as a DB admin (example): mysql -u ADMIN -p arisgourmet < privileged_changes.sql

-- 1) Add outbox retry columns (safe-if-supported). MySQL 8.0.16+ supports ADD COLUMN IF NOT EXISTS.
ALTER TABLE `outbox`
  ADD COLUMN IF NOT EXISTS `attempts` INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `last_error` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `next_retry_at` DATETIME NULL;

-- Optional: DLQ marker and reason
ALTER TABLE `outbox`
  ADD COLUMN IF NOT EXISTS `dlq` TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `dlq_reason` TEXT NULL;

-- 2) Create refresh_tokens table used by rotating refresh token implementation
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `revoked_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  INDEX (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Optional compatibility views (create if you need plural table names)
-- These statements require CREATE VIEW privilege.
CREATE OR REPLACE VIEW `productos` AS SELECT * FROM `producto`;
CREATE OR REPLACE VIEW `mesas` AS SELECT * FROM `mesa`;
CREATE OR REPLACE VIEW `roles` AS SELECT * FROM `role`;

-- 4) Example: drop compatibility views (if you want to remove them)
-- DROP VIEW IF EXISTS `productos`, `mesas`, `roles`;

-- 5) Optional: insert a migration record into TypeORM's migrations table
-- WARNING: only run this if you inspected the `migrations` table schema and understand the values.
-- INSERT INTO `migrations` (`timestamp`,`name`) VALUES ('1771802000000','add_outbox_retry_columns');

-- 6) Compatibility fallback for older MySQL: if server rejects ADD COLUMN IF NOT EXISTS,
--    run the following manual checks (execute one-by-one as admin):
--
-- SELECT COUNT(*) FROM information_schema.columns
--  WHERE table_schema=DATABASE() AND table_name='outbox' AND column_name='attempts';
-- -- If result = 0 then run:
-- ALTER TABLE `outbox` ADD COLUMN `attempts` INT NOT NULL DEFAULT 0;

-- Automated fallback using prepared statements (works on older MySQL versions)
-- This block conditionally alters the `outbox` table only when the column is absent.
-- Run as admin if `ADD COLUMN IF NOT EXISTS` is not supported.

SELECT IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='outbox' AND column_name='attempts')=0,
  'ALTER TABLE `outbox` ADD COLUMN `attempts` INT NOT NULL DEFAULT 0', 'SELECT "skip_attempts"') INTO @sql; 
PREPARE stmt FROM @sql; 
EXECUTE stmt; 
DEALLOCATE PREPARE stmt;

SELECT IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='outbox' AND column_name='last_error')=0,
  'ALTER TABLE `outbox` ADD COLUMN `last_error` TEXT NULL', 'SELECT "skip_last_error"') INTO @sql; 
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='outbox' AND column_name='next_retry_at')=0,
  'ALTER TABLE `outbox` ADD COLUMN `next_retry_at` DATETIME NULL', 'SELECT "skip_next_retry_at"') INTO @sql; 
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='outbox' AND column_name='dlq')=0,
  'ALTER TABLE `outbox` ADD COLUMN `dlq` TINYINT(1) NOT NULL DEFAULT 0', 'SELECT "skip_dlq"') INTO @sql; 
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='outbox' AND column_name='dlq_reason')=0,
  'ALTER TABLE `outbox` ADD COLUMN `dlq_reason` TEXT NULL', 'SELECT "skip_dlq_reason"') INTO @sql; 
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;


-- Rollback examples (commented):
-- ALTER TABLE `outbox` DROP COLUMN `attempts`;
-- ALTER TABLE `outbox` DROP COLUMN `last_error`;
-- DROP TABLE IF EXISTS `refresh_tokens`;
-- DROP VIEW IF EXISTS `productos`, `mesas`, `roles`;

-- End of privileged_changes.sql
