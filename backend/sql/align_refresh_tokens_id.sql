-- Align `refresh_tokens` id to BIGINT AUTO_INCREMENT and remove legacy varchar id
SET FOREIGN_KEY_CHECKS=0;

-- Copy legacy user_id -> usuario_id if needed
UPDATE `refresh_tokens` rt
SET rt.usuario_id = rt.user_id
WHERE (rt.usuario_id IS NULL OR rt.usuario_id = '') AND (rt.user_id IS NOT NULL AND rt.user_id <> '');

-- Drop index on user_id if present
ALTER TABLE `refresh_tokens` DROP INDEX `idx_refresh_user`;

-- Replace varchar id with auto-increment bigint primary key
ALTER TABLE `refresh_tokens` DROP PRIMARY KEY;
ALTER TABLE `refresh_tokens` ADD COLUMN `new_id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT FIRST, ADD PRIMARY KEY (`new_id`);
ALTER TABLE `refresh_tokens` DROP COLUMN `id`;
ALTER TABLE `refresh_tokens` CHANGE COLUMN `new_id` `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT;

-- Drop legacy `user_id` column (we've migrated values to `usuario_id`)
ALTER TABLE `refresh_tokens` DROP COLUMN IF EXISTS `user_id`;

SET FOREIGN_KEY_CHECKS=1;
