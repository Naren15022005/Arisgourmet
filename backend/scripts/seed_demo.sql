-- Insertar MESA-2 si no existe
INSERT INTO mesa (id, codigo_qr, restaurante_id, estado, ocupado, created_at, updated_at)
SELECT UUID(), 'MESA-2', '1', 'libre', 0, NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM mesa WHERE codigo_qr = 'MESA-2');

-- Insertar Producto: Porciones de Papas (si existe columna precio_cents)
-- Insertar Producto: Porciones de Papas (manejo dinámico de columna precio/precio_cents)
-- Insert product using actual schema: precio (decimal), descripcion, disponible, tiempo_base_minutos
INSERT INTO producto (id, nombre, descripcion, precio, disponible, tiempo_base_minutos, restaurante_id, created_at, updated_at)
SELECT UUID(), 'Porciones de Papas', '', 8.00, 1, 0, '1', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE restaurante_id='1' AND nombre='Porciones de Papas');

-- Insertar Producto: Ensalada pequeña (manejo dinámico de columna precio/precio_cents)
INSERT INTO producto (id, nombre, descripcion, precio, disponible, tiempo_base_minutos, restaurante_id, created_at, updated_at)
SELECT UUID(), 'Ensalada pequeña', '', 6.00, 1, 0, '1', NOW(), NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM producto WHERE restaurante_id='1' AND nombre='Ensalada pequeña');

-- Crear tabla migrations mínima si no existe
-- Registrar remove_compat_views migration solo si la tabla 'migrations' existe y no está registrada
SELECT COUNT(*) INTO @has_migrations FROM INFORMATION_SCHEMA.TABLES
 WHERE TABLE_SCHEMA = 'arisgourmet' AND TABLE_NAME = 'migrations';
SET @insert_sql = IF(@has_migrations > 0,
  "INSERT INTO migrations (timestamp, name) SELECT 1771801000000, '1771801000000-remove_compat_views.ts' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM migrations WHERE name = '1771801000000-remove_compat_views.ts');",
  "SELECT 'migrations table not present, skipping registration' as info"
);
PREPARE stmt_mig FROM @insert_sql; EXECUTE stmt_mig; DEALLOCATE PREPARE stmt_mig;
