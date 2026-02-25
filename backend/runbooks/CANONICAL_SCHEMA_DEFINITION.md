# Canonical Schema Definition (DB-first)

Fecha: 2026-02-23
Decisión formal: **la base de datos es la única fuente de verdad estructural**.

## Convenciones canónicas
- Nombres de tablas en singular.
- IDs principales `varchar(36)` para dominio funcional.
- Multi-tenant por columna `restaurante_id` en tablas operativas.
- `synchronize=false` obligatorio; cambios solo por migraciones versionadas.
- Prohibidas vistas de compatibilidad como capa de escritura.

## Tablas canónicas activas
- `restaurante`
- `role`
- `permiso`
- `role_permisos`
- `usuario`
- `mesa`
- `mesa_sesion`
- `producto`
- `pedido`
- `item_pedido`
- `historial_estado_pedido`
- `notificacion`
- `evento`
- `tiempo`

## Tablas distribuidas objetivo
- `refresh_tokens`
- `outbox`

Estas dos tablas forman parte del modelo canónico final, y se crean con migraciones (`1771804000000-ensure_outbox_and_refresh_tokens.ts`) y DDL canónico (`infra/ddls/core_schema.sql`).

## Estado actual verificado
- Sin vistas de compatibilidad (`compat_views_count = 0`).
- Entidades ORM alineadas a tablas canónicas singulares.
- Persistencia auth/mesas validada por pruebas de integración.
- Worker de outbox endurecido (locking lógico, retry exponencial, DLQ, idempotencia) y en espera de tabla `outbox` cuando falta aprovisionamiento.
