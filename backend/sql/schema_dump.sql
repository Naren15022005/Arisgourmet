-- Dump of important tables and columns for Schema Diff Report
SELECT table_name, GROUP_CONCAT(column_name ORDER BY ordinal_position SEPARATOR ', ') AS columns
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('usuario','producto','mesa','role','restaurante','outbox','refresh_tokens')
GROUP BY table_name;

SELECT table_name, column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN ('usuario','producto','mesa','role','restaurante','outbox','refresh_tokens')
ORDER BY table_name, ordinal_position;
