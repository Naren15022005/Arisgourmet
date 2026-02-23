**Deploy Checklist — Canonical Schema Release**

- **Scope:** Aplicar migraciones canónicas y tablas distribuidas (`outbox`, `refresh_tokens`) en entorno de producción.

- **Pre-reqs:**
  - Ventana de mantenimiento comunicada.
  - Backup completo de la base `arisgourmet` (dump + snapshot).
  - Acceso DBA con privilegios para crear/alterar tablas.
  - Redis accesible para workers (si aplica).

- **Step 0 — Preparación**:
  - Verificar branch y commit a desplegar.
  - Confirmar migraciones incluidas: `InitialMigration00011760000000000`, `MakeCanonicalSchema...`, `EnsureOutboxAndRefreshTokens...`.

- **Step 1 — Backup**:
  - `mysqldump --single-transaction --routines --triggers --events -u root -p arisgourmet > arisgourmet-backup-$(date +%F).sql`
  - Verificar copy en almacenamiento seguro.

- **Step 2 — Aplicar DDL por DBA (opcional)**
  - Si DBA debe ejecutar DDL por políticas, proporcionar `backend/runbooks/DBA_RELEASE_INSTRUCTIONS.md`.
  - Si se usa usuario `db_admin` con permisos, ejecutar:

```bash
# desde el repo (opcional)
node backend/scripts/apply_sql_args.js --user db_admin --pass <pass> --host <host> --port 3306 --db arisgourmet infra/ddls/create_distributed_tables.sql
```

- **Step 3 — Ejecutar migraciones versionadas**
  - Desde el servidor de aplicación con variables de entorno apuntando a la DB de producción (o por CI):

```bash
export DB_USER=db_admin
export DB_PASSWORD='<pass>'
export DB_HOST='<host>'
export DB_PORT=3306
export DB_NAME=arisgourmet
# Ejecutar migraciones
cd backend
npm ci --production
npm run migrate:run
```

- **Step 4 — Validaciones rápidas (post-migration)**
  - Ejecutar `backend/sql/phase_validation.sql` y confirmar:
    - No existen vistas de compatibilidad.
    - Tablas `outbox` y `refresh_tokens` presentes.
    - Migraciones aplicadas listadas en la tabla de history.

- **Step 5 — Habilitar workers / outbox processors**
  - Iniciar workers con variables de entorno de Redis/DB:

```bash
# ejemplo systemd service or docker compose
npm run start:worker
```

- **Step 6 — Smoke tests (endpoints críticos)**
  - Registrar usuario, login, refresh token, crear pedido rápido, verificar que outbox escribe eventos.

- **Rollback plan**
  - Restaurar backup SQL si hay corrupción de datos.
  - Para fallos de migración irreversibles, seguir runbook de DBA.

- **Post-deploy**
  - Ejecutar tests de carga/concurrencia programados.
  - Monitorizar métricas de outbox (pending, retries, dlq).

---

Contactos: DBA, SRE, Equipo Backend.
