# Borrador de esquema canónico (fuente: DB)

Generado: 2026-02-22T20:51:17.209Z

> Nota: Este borrador asume que la base de datos actual es la fuente canónica. Revisar antes de usar para migraciones.

## Tabla: historial_estado_pedido (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| pedido_id | bigint unsigned | NO |  |
| from_estado | varchar(50) | YES |  |
| to_estado | varchar(50) | NO |  |
| changed_by | bigint unsigned | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: item_pedido (VIEW)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(20) | YES |  |
| pedido_id | bigint unsigned | NO |  |
| producto_id | bigint unsigned | NO |  |
| cantidad | int unsigned | NO | 1 |
| precio_unitario | decimal(25,4) | YES |  |
| restaurante_id | binary(0) | YES |  |

## Tabla: mesa (VIEW)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(20) | YES |  |
| codigo_qr | varchar(100) | NO |  |
| estado | enum('libre','ocupada','reservada') | NO | libre |
| ocupado | int | NO | 0 |
| ocupado_desde | binary(0) | YES |  |
| ultima_actividad_at | binary(0) | YES |  |
| restaurante_id | bigint unsigned | NO |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: mesas (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| restaurante_id | bigint unsigned | NO |  |
| codigo | varchar(100) | NO |  |
| nombre | varchar(200) | YES |  |
| estado | enum('libre','ocupada','reservada') | NO | libre |
| metadata | json | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: migrations (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | int | NO |  |
| timestamp | bigint | NO |  |
| name | varchar(255) | NO |  |

## Tabla: notificaciones (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| restaurante_id | bigint unsigned | NO |  |
| tipo | varchar(100) | NO |  |
| payload | json | YES |  |
| sent | tinyint(1) | NO | 0 |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: outbox (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| aggregate_type | varchar(100) | NO |  |
| aggregate_id | varchar(100) | YES |  |
| event_type | varchar(150) | NO |  |
| payload | json | YES |  |
| processed | tinyint(1) | NO | 0 |
| processed_at | timestamp | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: pedido (VIEW)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(20) | YES |  |
| mesa_id | bigint unsigned | YES |  |
| restaurante_id | bigint unsigned | NO |  |
| estado | varchar(10) | NO |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: pedido_items (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| pedido_id | bigint unsigned | NO |  |
| producto_id | bigint unsigned | NO |  |
| cantidad | int unsigned | NO | 1 |
| price_cents | bigint unsigned | NO | 0 |
| metadata | json | YES |  |

## Tabla: pedidos (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| restaurante_id | bigint unsigned | NO |  |
| mesa_id | bigint unsigned | YES |  |
| usuario_id | bigint unsigned | YES |  |
| estado | enum('nuevo','en_proceso','listo','servido','cancelado') | NO | nuevo |
| total_cents | bigint unsigned | NO | 0 |
| metadata | json | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: permiso (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(36) | NO |  |
| clave | varchar(255) | NO |  |
| descripcion | varchar(255) | YES |  |

## Tabla: permisos (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | smallint unsigned | NO |  |
| nombre | varchar(100) | NO |  |
| descripcion | varchar(255) | YES |  |

## Tabla: producto (VIEW)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(20) | YES |  |
| restaurante_id | bigint unsigned | NO |  |
| nombre | varchar(255) | NO |  |
| descripcion | text | YES |  |
| precio | decimal(15,4) | YES |  |
| disponible | tinyint(1) | NO | 1 |
| tiempo_base_minutos | int | NO | 0 |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: productos (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| restaurante_id | bigint unsigned | NO |  |
| nombre | varchar(255) | NO |  |
| descripcion | text | YES |  |
| precio_cents | int unsigned | NO | 0 |
| disponible | tinyint(1) | NO | 1 |
| metadata | json | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: refresh_tokens (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| usuario_id | bigint unsigned | NO |  |
| token_hash | varchar(255) | NO |  |
| revoked | tinyint(1) | NO | 0 |
| replaced_by_token_id | bigint unsigned | YES |  |
| expires_at | timestamp | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: restaurante (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(36) | NO |  |
| nombre | varchar(255) | NO |  |
| direccion | varchar(255) | YES |  |
| telefono | varchar(255) | YES |  |
| created_at | datetime | NO | CURRENT_TIMESTAMP |
| updated_at | datetime | NO | CURRENT_TIMESTAMP |

## Tabla: restaurantes (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| nombre | varchar(200) | NO |  |
| metadata | json | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: role (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(36) | NO |  |
| nombre | varchar(255) | NO |  |

## Tabla: role_permisos (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| role_id | smallint unsigned | NO |  |
| permiso_id | smallint unsigned | NO |  |

## Tabla: roles (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | smallint unsigned | NO |  |
| nombre | varchar(50) | NO |  |
| descripcion | varchar(255) | YES |  |

## Tabla: sesiones_mesa (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| restaurante_id | bigint unsigned | NO |  |
| mesa_id | bigint unsigned | NO |  |
| usuario_id | bigint unsigned | YES |  |
| token | varchar(255) | YES |  |
| started_at | timestamp | NO | CURRENT_TIMESTAMP |
| ended_at | timestamp | YES |  |
| metadata | json | YES |  |

## Tabla: usuario (VIEW)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | varchar(20) | YES |  |
| restaurante_id | bigint unsigned | NO |  |
| email | varchar(200) | NO |  |
| nombre | varchar(200) | YES |  |
| password_hash | varchar(255) | NO |  |
| role | varchar(7) | NO |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

## Tabla: usuarios (BASE TABLE)

| Columna | Type | Nullable | Default |
|---|---:|---:|---|
| id | bigint unsigned | NO |  |
| restaurante_id | bigint unsigned | NO |  |
| email | varchar(200) | NO |  |
| password_hash | varchar(255) | NO |  |
| nombre | varchar(200) | YES |  |
| role_id | smallint unsigned | NO | 1 |
| metadata | json | YES |  |
| created_at | timestamp | NO | CURRENT_TIMESTAMP |
| updated_at | timestamp | NO | CURRENT_TIMESTAMP |

