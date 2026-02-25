# Release checklist — Alinear esquema canónico

Objetivo: pasos operativos reproducibles para desplegar los cambios de `feature/phase3-privileged-db` en staging/producción.

1) Preparación previa (en entorno de operaciones)
- Revisar y aprobar PR draft en GitHub; asignar `@DBA-team` y `@ops-team`.
- Confirmar backup reciente y válido de la BD (full dump + binary logs si aplica).

2) Backups
- Crear dump verificable (ejemplo MySQL):

```bash
mysqldump -u root -p --single-transaction --routines --events --triggers arisgourmet > /tmp/arisgourmet_precanonical_$(date +%F).sql
gzip /tmp/arisgourmet_precanonical_$(date +%F).sql
```

- Verificar checksum y copia segura fuera del host de producción.

3) Verificación de grants
- Confirmar que `db_admin` existe con ambos hosts y privileges necesarios:

```sql
SELECT User, Host FROM mysql.user WHERE User='db_admin';
SHOW GRANTS FOR 'db_admin'@'localhost';
SHOW GRANTS FOR 'db_admin'@'%';
```

4) Staging: ejecutar y validar
- Crear entorno staging con datos representativos o snapshot.
- Ejecutar DDL idempotente primero (dry-run si posible). Aplicar con `db_admin` en staging:

```bash
# desde repo
node backend/scripts/apply_sql_args.js --user db_admin --pass '<PASS>' --host <staging-db> --port 3306 --db arisgourmet infra/ddls/create_distributed_tables.sql
# luego (si aplica) ejecutar migraciones
cd backend && DB_HOST=<staging-db> DB_USER=db_admin DB_PASSWORD='<PASS>' npm run migrate:run
```

- Ejecutar tests de smoke y load leves en staging; validar métricas de outbox (entregas, errores, DLQ).

5) Plan de rollback
- Si un `ALTER TABLE` no puede revertirse fácilmente, documentar pasos manuales e impacto.
- Mantener copia del schema pre-despliegue (information_schema export) y dumps.

6) Ventana de mantenimiento y ejecución en producción
- Programar ventana con stakeholders.
- Poner aplicación en modo mantenimiento si procede.
- Repetir los pasos de staging en producción con `db_admin` y monitorizar.

7) Verificaciones post-despliegue
- Ejecutar smoke tests (endpoints básicos) y revisar logs por 30-60 minutos.
- Consultas útiles para outbox:

```sql
SELECT status, COUNT(*) FROM outbox GROUP BY status;
SELECT COUNT(*) FROM refresh_tokens WHERE revoked = 1;
```

8) Tagging y release
- Tag ligero indicando versión de schema (ejemplo):

```bash
git tag -a v1.2.0-canonical-schema -m "Canonical schema release: outbox + refresh_tokens"
git push origin --tags
```

9) Post-release
- Monitorizar métricas (outbox delivery rate, error rate) y alertas durante 24-72h.
- Si problemas críticos, ejecutar rollback plan y notificar equipos.

Contacto y referencias
- Runbooks: `backend/runbooks/`
- DDL principal: `infra/ddls/create_distributed_tables.sql`
