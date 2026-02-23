SELECT TABLE_NAME, TABLE_COLLATION
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'arisgourmet'
  AND TABLE_NAME IN ('refresh_tokens', 'usuario');

SELECT TABLE_NAME, COLUMN_NAME, COLLATION_NAME
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'arisgourmet'
  AND TABLE_NAME IN ('refresh_tokens', 'usuario');
