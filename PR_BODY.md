# PR: Alinear esquema canónico y habilitar Outbox / Refresh Tokens

Resumen corto
- Alinea el modelo de datos para que la base de datos sea la única fuente de verdad.
- Añade tablas distribuidas `outbox` y `refresh_tokens`, migraciones deterministas, y runbooks/operadores para despliegue seguro.

Cambios principales
- `infra/ddls/create_distributed_tables.sql`: DDL idempotente para `outbox` y `refresh_tokens`.
- `backend/src/migrations/*`: migraciones versionadas y deterministas.
- `backend/sql/*`: scripts de corrección (collation, IDs, PKs) aplicados durante la validación.
- `backend/scripts/*`: helpers para ejecutar SQL de forma no interactiva y reproducible.
- `backend/runbooks/*`: procedimientos operativos para DBA/ops y checklist de despliegue.

Pruebas realizadas
- Migraciones locales ejecutadas: ninguna pendiente (`Migrations run: []`).
- Suite E2E y load tests locales: todos los tests pasaron.
- Validaciones automáticas de collation y de esquema completed; fixes aplicados en `backend/sql/`.

Checklist obligatorio antes de merge / despliegue en producción
- [ ] Backup completo de la BD (snapshot y dump verificable).
- [ ] Revisión de DDL por el equipo DBA (validar `db_admin` grants y hosts: `'db_admin'@'localhost'` y `'db_admin'@'%'`).
- [ ] Ejecutar migraciones en staging y validar métricas de outbox (tasa de entrega, errores, tamaño de DLQ).
- [ ] Ventana de mantenimiento acordada para `ALTER TABLE` en tablas con alto volumen.
- [ ] Plan de rollback documentado y probado en staging.
- [ ] Smoke tests y sanity checks tras desplegar en prod.

Operativa recomendada
- Marcar este PR como **Draft** hasta que DBA confirme grants y backup esté listo.
- Asignar reviewers: `@DBA-team`, `@backend-team`, `@ops-team`.
- Etiquetas sugeridas: `db-migrations`, `release/canonical-schema`, `infra`.

Cómo crear el PR localmente
1. Asegúrate de estar en la rama con los cambios:

```bash
git checkout feature/phase3-privileged-db
git push origin feature/phase3-privileged-db
```

2. En GitHub: Pull requests → New pull request → base `main`, compare `feature/phase3-privileged-db`.
3. Pega esta descripción en el cuerpo del PR y crea como **Draft**.

Enlaces útiles
- Runbooks: `backend/runbooks/`
- DDL principal: `infra/ddls/create_distributed_tables.sql`
- Scripts de corrección: `backend/sql/`

Notas finales
- No se eliminaron vistas de compatibilidad automáticamente; las revisiones de compatibilidad se harán por separado.
- Tras merge, coordinar con DBA para aplicar DDL en producción en la ventana acordada.
