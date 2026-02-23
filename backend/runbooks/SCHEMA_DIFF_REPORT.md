# Schema Diff Report — Phase 3 (initial)

Generated: 2026-02-23

Scope: selected key tables discovered in live `arisgourmet` DB (via `backend/sql/schema_dump.sql`).

DB reality (summary)
- `mesa` (table): columns: `id` varchar(36), `codigo_qr` varchar(255), `estado` enum('libre','ocupada','activa','inactiva','liberada') default 'libre', `ultima_actividad_at` datetime NULL, timestamps with fractional seconds (`datetime(6)`), `ocupado` tinyint default 0, `ocupado_desde` timestamp NULL, `restaurante_id` varchar(255) NULL.
- `producto` (table): columns: `id` varchar(36), `nombre` varchar(255), `descripcion` text NULL, `precio` decimal(10,2), `disponible` tinyint default 1, `tiempo_base_minutos` int default 0, timestamps with fractional seconds, `restaurante_id` varchar(255) NULL.
- `restaurante` (table): `id` varchar(36), `nombre` varchar(255), `direccion` varchar(255) NULL, `telefono` varchar(255) NULL, `created_at`/`updated_at` datetime.
- `role` (table): `id` varchar(36), `nombre` varchar(255).
- `usuario` (table): `id` varchar(36), `email` varchar(255), `nombre` varchar(255), `password_hash` varchar(255), `role` enum('cliente','cocina','host','admin') default 'cliente', timestamps fractional, `restaurante_id` varchar(255) NULL.
- `outbox` and `refresh_tokens`: not present / partial in this dump (previous work shows `outbox` exists but retry columns may be missing; `refresh_tokens` absent until DBA run).

Key mismatches to resolve (recommended canonical = DB)
1. Table naming: DB uses singular names (`mesa`, `producto`, `usuario`, `role`, `restaurante`). If ORM entities currently map to plural table names, update entities to `@Entity('mesa')` etc.
2. `producto.precio` is `decimal(10,2)` in DB — ensure entity uses `type: 'decimal', precision: 10, scale: 2` and code handles as string/BigNumber where needed.
3. `restaurante_id` present as `varchar(255)` and nullable on many tables — entities should model it as `string | null` with `nullable: true` and not assume numeric FK.
4. `usuario.role` is an `enum(...)` column (not FK) — map entity property to enum string, do not expect `role_id` FK unless you plan to change DB.
5. `mesa.codigo_qr` column exists (not `codigo`) — align entity column name.
6. Timestamps: DB uses `datetime(6)` fractional precision in many tables — ensure entities use `type: 'datetime'` and correct precision when setting default values or queries.
7. `outbox` requires retry/DLQ columns (migration prepared) — these need DBA privileges; migration files are in repo but cannot run until DBA applies privileged bundle.

Immediate Phase 3 actions (most convenient / low-privilege first)
- A1: Update ORM entity files under `backend/src/entities/` to match DB reality (singular table names, column names, types, nullability). Commit changes.
- A2: Add TypeORM migration files (versioned) that reflect safe, non-privileged changes (e.g., metadata-only updates). For changes that require ALTER, keep migration SQL in repo and mark as requiring DBA execution (already done in `backend/sql/privileged_changes.sql`).
- A3: Run test suite locally against `copilot` user after entity updates and adjust code (services/controllers) for type differences (e.g., price handling).

Follow-up privileged actions (DBA required)
- P1: Apply `backend/sql/privileged_changes.sql` (adds `outbox` retry/DLQ columns, creates `refresh_tokens`, optionally creates compatibility views). DBA must run and return `post_privileged_checks.sql` output.
- P2: After DBA applies, run `npm run migrate:run` as deployer (or insert migration records) and verify all migrations recorded.

Acceptance criteria for Phase 3 completion
- ORM entities in `backend/src/entities/*` match DB schema exactly (table names, column names, types, nullability, enums).
- Tests pass against live DB (CI will check via workflow).
- All schema changes that require admin privileges are captured as SQL in repo and marked for DBA execution.

Next immediate step I will perform: update entity files to align with the DB schema above, create a small migration stub if needed, and run local tests. If you prefer a different order, tell me now.
