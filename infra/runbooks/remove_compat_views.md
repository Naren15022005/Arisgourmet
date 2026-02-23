# Runbook: Eliminar vistas de compatibilidad

Objetivo: eliminar de forma controlada las vistas SQL temporales definidas en `infra/ddls/compat_views.sql` una vez que el ORM y las tablas reales coinciden.

Precondiciones:
- Confirmar que las entidades ORM ya están alineadas con el esquema real (tests E2E verdes).
- Tener backup reciente de la base de datos y un plan de restauración probado.
- Ventana de mantenimiento para pausar o degradar escrituras (si aplica).

Pasos sugeridos:
1. Ejecutar en staging: correr migración añadida `RemoveCompatViews1771801000000` con `npm run migrate:run` apuntando al staging DB.
2. Validar que las rutas/queries que antes leían de las vistas ahora leen tablas reales (ejecutar tests de integración y smoke tests).
3. Monitorear errores 5-10 minutos en staging: queries lentas, 500s o datos faltantes.
4. Plan de rollback: si hay problemas, ejecutar `npm run migrate:revert` para esta migración (recrea las vistas desde `infra/ddls/compat_views.sql`).
5. En producción: programar ventana corta, detener jobs que escriben en vistas si existieran, ejecutar migración, validar smoke tests y métricas de negocio.

Notas técnicas:
- La migración es idempotente y usa `DROP VIEW IF EXISTS` en `up()` y recrea las vistas leyendo `infra/ddls/compat_views.sql` en `down()`.
- Si la conexión de migrations no permite múltiples statements, la migración ejecuta declaraciones statement-by-statement.

Checklist post-migración:
- [ ] No hay errores en logs relacionados con lecturas de vistas.
- [ ] Tests E2E pasan en producción-duplicado (si aplica).
- [ ] Monitor de latencia y errores en P99/P95 estable.
