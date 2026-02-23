SELECT table_name, column_name, column_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = DATABASE()
  AND table_name IN (
    'evento','historial_estado_pedido','item_pedido','mesa','mesa_sesion','notificacion','pedido','permiso','producto','restaurante','restaurantes','role','role_permisos','tiempo','usuario','outbox','refresh_tokens'
  )
ORDER BY table_name, ordinal_position;

SELECT table_name, index_name, non_unique, GROUP_CONCAT(column_name ORDER BY seq_in_index) AS cols
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND table_name IN (
    'evento','historial_estado_pedido','item_pedido','mesa','mesa_sesion','notificacion','pedido','permiso','producto','restaurante','restaurantes','role','role_permisos','tiempo','usuario','outbox','refresh_tokens'
  )
GROUP BY table_name, index_name, non_unique
ORDER BY table_name, index_name;
