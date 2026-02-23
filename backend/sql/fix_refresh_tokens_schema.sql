-- Make refresh_tokens table compatible with entity expectations
ALTER TABLE `refresh_tokens`
  ADD COLUMN IF NOT EXISTS `usuario_id` VARCHAR(36) NULL AFTER `id`,
  ADD COLUMN IF NOT EXISTS `token_hash` VARCHAR(255) NOT NULL DEFAULT '' AFTER `usuario_id`,
  ADD COLUMN IF NOT EXISTS `revoked` BOOLEAN NOT NULL DEFAULT FALSE AFTER `token_hash`,
  ADD COLUMN IF NOT EXISTS `replaced_by_token_id` BIGINT UNSIGNED NULL AFTER `revoked`,
  ADD COLUMN IF NOT EXISTS `expires_at` DATETIME NULL AFTER `replaced_by_token_id`;

-- If there is an existing legacy `user_id` column, copy values into `usuario_id` when empty
UPDATE `refresh_tokens` rt
SET rt.usuario_id = rt.user_id
WHERE rt.usuario_id IS NULL AND rt.user_id IS NOT NULL;

-- No destructive drops here; keep legacy columns for safety.
