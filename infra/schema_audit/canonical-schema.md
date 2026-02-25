# Canonical Schema Definition (Draft — DB as source of truth)

Decisión: la base de datos actual (`arisgourmet`) se toma como fuente canónica del modelo de datos. Las entidades ORM se actualizarán para reflejar este esquema antes de eliminar las vistas de compatibilidad.

Objetivo: definir la estructura definitiva (tablas, columnas, tipos, nullability, índices y FKs) que el equipo acepta como canónica.

Principales decisiones y convenciones
- Identificadores primarios: usar `BIGINT UNSIGNED AUTO_INCREMENT` como PK para las tablas existentes (`mesas`, `productos`, `pedidos`, `usuarios`, etc.).
- Tipos monetarios: mantener `precio_cents INT`/`BIGINT` en tablas fuente y mapear en la capa de dominio a decimal cuando sea necesario (no cambiar la unidad de almacenamiento sin migración explícita).
- Timestamps: usar `TIMESTAMP`/`DATETIME` tal como están en la BD; ORM debe mapear a `Date`.
- Booleans: BD usa `TINYINT(1)`/`INT`; ORM debe mapear a boolean con columnas numéricas.
- Foreign keys: respetar FKs ya definidas (`restaurante_id`, etc.) y mantener restricciones (ON DELETE CASCADE/SET NULL) según DDL actual.
- Outbox & refresh_tokens: conservar tablas `outbox` y `refresh_tokens` como en el DDL canónico (IDs numéricos, hash de token, timestamps).

Resumen de tablas clave (extracto del borrador generado)
- `restaurantes` — id: bigint unsigned PK, nombre, metadata, created_at, updated_at
- `usuarios` — id: bigint unsigned PK, restaurante_id FK, email, password_hash, nombre, role_id (FK a `roles`), created_at, updated_at
- `mesas` — id: bigint unsigned PK, restaurante_id FK, codigo, nombre, estado, created_at, updated_at
- `productos` — id: bigint unsigned PK, restaurante_id FK, nombre, descripcion, precio_cents, disponible, created_at, updated_at
- `pedidos` / `pedido_items` — estructura basada en `pedidos` y `pedido_items` con total_cents, estados y FKs a `mesas` y `usuarios`.
- `refresh_tokens` — id: bigint unsigned PK, usuario_id FK, token_hash, revoked, replaced_by_token_id, expires_at, created_at
- `outbox` — id: bigint unsigned PK, aggregate_type, aggregate_id, event_type, payload JSON, processed, processed_at, created_at

Condición de aceptación del esquema canónico
- Documento `infra/schema_audit/canonical-schema.md` (actual) aprobado por el equipo.
- Lista completa de diferencias (ver `infra/schema_audit/orm-db-diff-*.md`) cubierta por el plan de migración o por cambios en las entidades.
- Tests E2E básicos funcionan contra el esquema canónico en staging.

Próximos pasos inmediatos (para Phase 2)
1. Revisar y aprobar este documento con stakeholders. (revisión humana)
2. Generar el `migration-plan.md` con acciones por tabla/entidad y riesgos.
3. Producción de lista de cambios por entidad (archivo `infra/schema_audit/entity-change-list.md`) para aplicar en el código.
