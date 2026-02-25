-- Compatibility views to map existing plural schema to singular table names expected by TypeORM entities
-- Created: 2026-02-22
USE arisgourmet;

DROP VIEW IF EXISTS mesa;
CREATE VIEW mesa AS
SELECT
  CAST(id AS CHAR) AS id,
  codigo AS codigo_qr,
  estado,
  FALSE AS ocupado,
  NULL AS ocupado_desde,
  NULL AS ultima_actividad_at,
  restaurante_id,
  created_at,
  updated_at
FROM mesas;

DROP VIEW IF EXISTS producto;
CREATE VIEW producto AS
SELECT
  CAST(id AS CHAR) AS id,
  restaurante_id,
  nombre,
  descripcion,
  (precio_cents/100.0) AS precio,
  disponible,
  0 AS tiempo_base_minutos,
  created_at,
  updated_at
FROM productos;

DROP VIEW IF EXISTS pedido;
CREATE VIEW pedido AS
SELECT
  CAST(id AS CHAR) AS id,
  mesa_id,
  restaurante_id,
  CASE
    WHEN estado = 'nuevo' THEN 'pendiente'
    WHEN estado = 'en_proceso' THEN 'preparando'
    WHEN estado = 'listo' THEN 'listo'
    WHEN estado = 'servido' THEN 'entregado'
    ELSE 'cancelado'
  END AS estado,
  created_at,
  updated_at
FROM pedidos;

DROP VIEW IF EXISTS item_pedido;
CREATE VIEW item_pedido AS
SELECT
  CAST(id AS CHAR) AS id,
  pedido_id AS pedido_id,
  producto_id AS producto_id,
  cantidad AS cantidad,
  (price_cents/100.0) AS precio_unitario,
  NULL AS restaurante_id
FROM pedido_items;

DROP VIEW IF EXISTS usuario;
CREATE VIEW usuario AS
SELECT
  CAST(id AS CHAR) AS id,
  restaurante_id,
  email,
  nombre,
  password_hash,
  'cliente' AS role,
  created_at,
  updated_at
FROM usuarios;

-- Other supporting views (outbox, refresh_tokens, notificaciones) can be added if needed
