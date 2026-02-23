-- Align `usuario` table to utf8mb4_unicode_ci to match new tables
ALTER TABLE `usuario` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verify by selecting current collation (no-op if client doesn't support):
SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuario';
