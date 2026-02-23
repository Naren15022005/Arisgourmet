SELECT 'compat_views_count' AS check_name, COUNT(*) AS value
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('mesas','productos','roles','usuarios','pedidos','pedido_items','restaurantes');

SELECT 'canonical_tables_present' AS check_name, table_name
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND table_name IN ('restaurante','role','permiso','role_permisos','usuario','mesa','mesa_sesion','producto','pedido','item_pedido','historial_estado_pedido','notificacion','evento','tiempo')
ORDER BY table_name;

SELECT 'missing_distributed_tables' AS check_name,
       SUM(CASE WHEN t.table_name = 'refresh_tokens' THEN 1 ELSE 0 END) AS has_refresh_tokens,
       SUM(CASE WHEN t.table_name = 'outbox' THEN 1 ELSE 0 END) AS has_outbox
FROM information_schema.TABLES t
WHERE t.TABLE_SCHEMA = DATABASE() AND t.table_name IN ('refresh_tokens','outbox');

SELECT 'tenant_columns' AS check_name, table_name, column_name
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND column_name = 'restaurante_id'
  AND table_name IN ('usuario','mesa','producto','pedido','item_pedido','tiempo')
ORDER BY table_name;
