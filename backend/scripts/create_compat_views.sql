-- Compat views: map singular DB tables to plural names expected by entities
CREATE OR REPLACE VIEW roles AS
SELECT id, nombre FROM role;

CREATE OR REPLACE VIEW productos AS
SELECT id, nombre, descripcion, CAST(ROUND(precio * 100) AS UNSIGNED) AS precio_cents, disponible, tiempo_base_minutos, restaurante_id, created_at, updated_at
FROM producto;

CREATE OR REPLACE VIEW mesas AS
SELECT id, restaurante_id, codigo_qr AS codigo, NULL AS nombre, estado, NULL AS metadata, created_at, updated_at
FROM mesa;
