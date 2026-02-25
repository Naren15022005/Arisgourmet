# Migration Plan (Phase 2 → Phase 3 preparation)

Objetivo: producir un plan ordenado, seguro y reversible para alinear las entidades ORM con el esquema canónico (DB), minimizando riesgo sobre datos en producción.

Resumen de estrategia
- Decisión: mantener la BD como fuente canónica. Por tanto, en la mayoría de los casos se actualizarán las entidades y el código para coincidir con tipos y nombres actuales de la BD.
- Evitar cambios destructivos en la BD durante la migración inicial; las migraciones de DDL sólo se usarán si es estrictamente necesario y acompañadas de backups y pruebas.

Fases del plan de migración

1) Preparación (no intrusiva)
   - Crear rama: `schema/align-orm-to-db`.
   - Añadir pruebas unitarias e2e que cubran los endpoints críticos (auth, mesas, pedidos).
   - Tener backups y snapshot de la BD (dump completo) antes de cualquier cambio en producción.

2) Lista de cambios por entidad (work items)
   - Generar `entity-change-list.md` (por cada entidad):
     - Cambiar `@PrimaryGeneratedColumn('uuid')` → `@PrimaryGeneratedColumn()` con tipo numérico o usar `@PrimaryGeneratedColumn('increment')` para `bigint` según convención.
     - Actualizar columnas `restaurante_id`, `usuario_id`, etc. a `number` (o `string` si se decide mapear a string), correspondiendo al tipo en BD.
     - Ajustar flags `nullable`, `length`, `enum` y `default` para que coincidan con BD.
     - Revisar relaciones `@ManyToOne` / `@OneToMany` y su propiedad `joinColumn` para usar los nombres reales de columnas (`mesa_id`, `pedido_id`, etc.).

3) Implementación incremental (local → staging → production)
   - Por cada entidad modificada:
     a) Implementar cambios en `backend/src/entities/*` en una rama de feature.
     b) Ejecutar linter/compilación y tests en CI.
     c) Ejecutar pruebas E2E localmente apuntando a una copia de la BD (o entorno de staging).
     d) Desplegar a staging y ejecutar suite de regresión completa.
     e) Si todo ok, agrupar cambios en PRs pequeños y coherentes para revisión.

4) Validación y limpieza
   - Una vez todas las entidades actualizadas y probadas, planear la eliminación de vistas de compatibilidad en una ventana controlada:
     - Crear script `infra/ddls/remove_compat_views.sql` que dropee las vistas.
     - En staging ejecutar el script y validar operaciones CRUD y E2E.
     - Programar ventana de despliegue en producción con rollback plan (restauración desde dump).

5) Rollback & mitigación
   - Rollback inmediato: restaurar snapshot o re-aplicar vistas (script de creación) si se detecta fallo grave.
   - Mínimo viable: mantener una rama para reintroducir temporalmente cambios si hay incompatibilidades.

Consideraciones operacionales y riesgos
- Backups previos obligatorios. Probar proceso de restore en staging.
- Monitoreo: logs y métricas para detectar errores tras despliegue (Sentry/Prometheus).
- Asegurar integridad en refresh_tokens y outbox: validar que los IDs referenciados funcionan con nuevos mapeos.

Entregables de esta fase
- `infra/schema_audit/entity-change-list.md` (tareas por entidad)
- PRs de entidades con tests verdes
- `infra/ddls/remove_compat_views.sql` (script para eliminar vistas)
- Runbook de despliegue y rollback
