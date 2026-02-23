SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, COLUMN_KEY, EXTRA
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='usuario' AND COLUMN_NAME='id';

SELECT COUNT(*) AS total_rows, SUM(id='') AS empty_id_count FROM usuario;

SELECT id, email, role, role_id FROM usuario WHERE id = '' LIMIT 10;
