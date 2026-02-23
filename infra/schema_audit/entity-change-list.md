# Entity Change List — Alinear ORM con DB canónica

Decisión tomada: la base de datos (`arisgourmet`) es la fuente canónica. A continuación se listan los cambios por entidad que debemos aplicar en `backend/src/entities/*` para que las entidades TypeORM reflejen exactamente el esquema real.

Instrucciones generales
- Crear rama: `schema/align-orm-to-db` antes de cualquier cambio.
- Hacer cambios por entidad en PRs pequeños (1–3 entidades por PR) con tests y CI verdes.
- No aplicar `synchronize: true` en DataSource.
- Ejecutar la suite de tests y las pruebas E2E en entorno de staging con copia de BD antes de merge.

Formato por entidad: Nombre — resumen → cambios concretos → snippet sugerido

1) `Usuario` (archivo: `backend/src/entities/usuario.entity.ts`)
- Resumen: DB usa `usuarios.id` como `BIGINT UNSIGNED AUTO_INCREMENT` (no UUID). `restaurante_id` es NOT NULL bigint; `role` actualmente viene por `role_id` FK a `roles`.
- Cambios concretos:
  - Cambiar `@PrimaryGeneratedColumn('uuid') id: string` → `@PrimaryGeneratedColumn() id: number` (o `bigint` mapping según convención). Preferir `number` pero considerar `string` si se usa `bigint` JS-safe handling.
  - `email` mantener `string`, `nombre` nullable true por BD.
  - `password_hash` mantener `string`.
  - Cambiar `role: UserRole` a relación con `Role` si DB usa `role_id` (ajustar a `role_id` numeric FK).
  - `restaurante_id` debe ser `number` y `nullable: false`.

Snippet sugerido:
```ts
@PrimaryGeneratedColumn()
id: number;

@Column()
email: string;

@Column({ nullable: true })
nombre?: string;

@Column()
password_hash: string;

@Column({ nullable: false })
restaurante_id: number;

@ManyToOne(() => Role)
@JoinColumn({ name: 'role_id' })
role: Role;
```

2) `Restaurante` (`restaurante.entity.ts`)
- Resumen: BD tiene `restaurantes.id` bigint auto-inc; además hay otra tabla `restaurante` (varchar id) — usar `restaurantes` canonical.
- Cambios:
  - `@PrimaryGeneratedColumn()` numérico
  - `created_at` / `updated_at` mapear a `@CreateDateColumn({ type: 'timestamp' })` / `@UpdateDateColumn({ type: 'timestamp' })` si ya no lo están.

3) `Mesa` (`mesa.entity.ts`)
- Resumen: DB tiene `mesas` base table with bigint id; views `mesa` expose id as varchar(20) for compatibility. Use `mesas` structure.
- Cambios:
  - PK numeric `@PrimaryGeneratedColumn()`
  - `codigo` column name mapping: ensure column name `codigo` (not `codigo_qr`), or use `@Column({ name: 'codigo' }) codigo_qr` if domain name differs.
  - `estado` enum keep DB enum values and types; map TypeORM enum to string-backed enum.
  - `restaurante_id` numeric non-nullable.

4) `Producto` (`producto.entity.ts`)
- Resumen: DB stores price in `precio_cents` INT — entity used decimal `precio`.
- Cambios:
  - Keep domain getter for decimal, but entity columns should include `precio_cents` INT.
  - PK numeric, `restaurante_id` numeric non-nullable.

Snippet for price handling:
```ts
@Column({ name: 'precio_cents', type: 'int', default: 0 })
precio_cents: number;

get precio(): number { return this.precio_cents / 100; }
set precio(v: number) { this.precio_cents = Math.round(v * 100); }
```

5) `Pedido` / `PedidoItem` (`pedido.entity.ts`, `pedido-item.entity.ts`)
- Resumen: DB uses `pedidos` and `pedido_items` with bigint numeric PKs; `pedido_items` has `price_cents`.
- Cambios:
  - PK numeric.
  - FK columns numeric (mesa_id, usuario_id) nullable as DB.
  - Use `total_cents` and `price_cents` numeric in entities; expose domain decimals via accessors.

6) `RefreshToken` (`refresh-token.entity.ts`)
- Resumen: DB: `refresh_tokens.usuario_id` is bigint FK; token_hash varchar(255), revoked tinyint.
- Cambios:
  - PK numeric, usuario relation to numeric id, token_hash string.
  - Map `revoked` to boolean with `{ type: 'tinyint', width: 1 }` if necessary.

7) `Outbox` (`outbox.entity.ts`)
- Resumen: Outbox table uses `aggregate_id` varchar and `processed` tinyint.
- Cambios:
  - Ensure `processed` maps to boolean; `payload` JSON typed.

8) `Role`, `Permiso`, `RolePermisos`
- Resumen: DB has `roles` and `permisos` (numeric ids). Update entities to numeric PKs and adjust many-to-many join table to use numeric FK column names (`role_id`, `permiso_id`) instead of `roleId`/`permisoId` camelcase.

9) `HistorialEstadoPedido`, `Notificacion`, `MesaSesion`, `Evento`, `Tiempo`
- Resumen: Several ORM entities are missing corresponding DB tables or have naming mismatches. For missing tables:
  - If table exists under a different name (e.g., `notificaciones` vs `notificacion`) align entity tableName via `@Entity('notificaciones')`.
  - If truly missing and required, create migrations (careful) or adjust code to not reference missing tables until schema alignment.

Checklist de QA por PR
- Ejecutar `npm test` y E2E local.
- Ejecutar `scripts/schema_audit.ts` y `scripts/compare_orm_db.ts` para validar que diffs disminuyen.
- Validar manualmente endpoints críticos: auth, mesas, pedidos.

Notas finales
- Para campos `bigint unsigned` puedes optar por usar `number` en TS y aceptar límite de precisión para IDs < 2^53, o usar `string` si esperas IDs mayores; muchas codebases prefieren `string` for DB BIGINT to be safe. Tomar decisión uniforme y documentarla en `canonical-schema.md`.
- Recomiendo agrupar cambios por área funcional: Auth (usuarios, roles, refresh_tokens), Ordering (mesas, pedidos, pedido_items, productos), Infra (outbox, notificaciones).

Si confirmas, aplico los primeros cambios (Auth area) en `backend/src/entities` y abro PRs para revisión.
