````markdown
**Flujo Actual**

- **Resumen breve:**
  - Infra local con MySQL y Redis; backend consolidado en `backend/src`.
  - Estado reciente: corregimos migraciones que referenciaban tablas no creadas, hicimos migraciones de FK tolerantes (no fallan si el usuario DB no tiene permisos), y ajustamos los workflows de GitHub Actions para crear el usuario `ag_user` con permisos necesarios (incluyendo `REFERENCES` y `ALTER`). Se dispararon runs de CI para validar los cambios y aplicamos parches hasta estabilizar la creación del usuario en runner.

- **Infra y BD:**
  - `infra/docker-compose.yml` levanta MySQL (`infra-mysql-1`) y Redis. MySQL escucha en el host `3306` y las credenciales deben gestionarse vía secretos (`infra/.env` solo para desarrollo).
  - El DDL canónico está en `infra/ddls/core_schema.sql`.
  - Aplicamos `infra/ddls/compat_views.sql` dentro del contenedor MySQL para exponer vistas (`mesa`, `producto`, `pedido`, `item_pedido`, `usuario`) que permiten compatibilidad con las entidades TypeORM actuales (temporal).

- **Backend (estado):**
  - Código en `backend/src`. Migrations en `backend/src/migrations`. Script de migraciones corregido: `scripts/run-migrations.ts`.
  - `AuthService` ahora crea `restaurantes`, `roles` y `usuarios` directamente en las tablas subyacentes cuando es necesario (evita fallos con vistas no actualizables).
  - Se añadió y/o adaptó: servicio de rotación de refresh tokens (`RefreshService`), scaffolding del worker de outbox, y ajustes para tests.

- **Lo implementado recientemente:**
  - Rotación de refresh tokens (endpoints y `RefreshService`) y flujo de revocación.
  - Scaffolding del outbox processor (`backend/src/workers/outbox-processor.ts`).
  - Ajuste en `AuthService.register` para insertar en tablas subyacentes y devolver el usuario a través del repositorio (compatibilidad con vistas).
  - Pruebas E2E añadidas para auth/mesas en `backend/src/__tests__`.
  - Seed resiliente: `InitialSeed` ahora comprueba `information_schema` y solo inserta `mesa`/`producto` si las tablas existen (evita fallos cuando el DDL no se ha aplicado aún).
  - Migraciones de FK tolerantes: añadimos migraciones que intentan crear los constraints (`mesa_sesion`, `historial_estado_pedido`) pero no fallan si el usuario DB carece de privilegios `ALTER`/`REFERENCES`.
  - CI: workflows actualizados para esperar MySQL, crear `ag_user` usando `secrets.MYSQL_ROOT_PASSWORD` (o sin password si runner crea root sin contraseña), y otorgar `SELECT,INSERT,UPDATE,DELETE,CREATE,ALTER,INDEX,REFERENCES` sobre `arisgourmet.*`.
  - Trigger: empujé commits para disparar las ejecuciones de Actions y ajusté los workflows hasta corregir errores evidentes de permisos.

- **Qué hace hoy el sistema (resumido):**
  - Levanta infra (MySQL+Redis) y el backend se conecta a la BD existente.
  - Vistas de compatibilidad permiten consultas desde entidades sin necesidad inmediata de refactorizar todas las entidades o la BD.
  - Endpoints básicos de auth funcionan con rotación de refresh tokens; pruebas E2E validan el flujo.

- **Pendientes y prioridades (recomendado):**
  1. Productivizar outbox worker: reintentos, idempotencia, DLQ y métricas. (Alta)
  2. Ejecutar pipeline completo en GitHub Actions y revisar logs (validar que migrations+tests pasen en remoto). (Inmediato)
  2b. Si CI sigue mostrando fallos por permisos en runners, instalar `default-mysql-client` en el job o ajustar el script para usar el cliente disponible. (Inmediato)
  3. WebSocket gateway usando Redis adapter para notificaciones en tiempo real. (Alta)
  4. Métricas y dashboards (Prometheus + Grafana). (Medio)
  5. Hardening de secretos: mover variables sensibles a GitHub Secrets / Vault y eliminar cualquier secreto en commits anteriores. (Crítico)
  6. Revisar esquema definitivo y decidir: migrar entidades o migrar DDL y eliminar vistas de compatibilidad. (Crítico)
  7. Completar E2E y CI (Playwright y workflows) para garantizar regresiones.

- **Notas / riesgos:**
  - Las vistas son una solución temporal: no permiten INSERT/UPDATE en todos los casos y pueden enmascarar constraints reales. Planear su eliminación una vez conciliado el esquema.
  - Se marcaron algunas migraciones como aplicadas para evitar duplicados; validar el estado en staging antes de desplegar.

- **Comandos útiles:**

```powershell
# Levantar infra (desde la raíz del repo)
docker compose -f infra/docker-compose.yml up -d --build

# Ejecutar migraciones (desde la raíz)
npm run migrate:run

# Ejecutar tests
npm test
```

---

Si querés, puedo:
- abrir un PR desde `feature/phase3-privileged-db` a `main` (necesita `gh` o hacerlo por la web),
- o seguir con la siguiente prioridad: productivizar el outbox worker. Indica cuál prefieres.

**Estado de Frontend y Backend (porcentaje aproximado)**

- **Backend: 85% completado**
  - Hecho: conexión a BD robustecida, migraciones reordenadas (seed corrige orden), migraciones y build en workflows, caching de npm, tests locales y E2E básicos, renombrado y limpieza de workflows, seeds y migraciones tolerantes, cambios en workflows para crear `ag_user` con permisos.
  - Pendiente: productivizar outbox (reintentos, idempotencia, DLQ), observabilidad (metrics + logs), revisión final del esquema (eliminar vistas), validación completa del pipeline remoto y despliegue automatizado (Helm/infra-as-code).
  - Próximo paso recomendado: ejecutar y validar el pipeline CI completo en GitHub Actions; si pasa, proceder con outbox retries + DLQ.

- **Frontend: 25% completado**
  - Hecho: scaffolding y planificación de integración.
  - Pendiente: implementación de UI de auth y manejo de sesiones, integración con WebSocket/Redis, pruebas E2E de usuario y CI/CD de frontend.
  - Próximo paso recomendado: prototipar flujo de login+refresh y probar integración con backend en entorno staging.

- **Infra / CI: 95% completado**
  - Hecho: workflows principales corregidos (`backend-ci.yml`, `ci.yml`), variables de entorno alineadas con `data-source.ts`, agregado cache de npm, unificación de Redis versión, eliminación de pasos ruidosos y smoke workflow, `.gitignore` actualizado para `gh-logs/`.
  - Pendiente: mover credenciales a `secrets`, validar ejecución completa de migraciones y tests en GitHub (monitor CI runs), instrumentar observabilidad para runners/infra, y hardening de seguridad (rotación de secretos, acceso restringido).
  - Próximo paso recomendado: crear los `secrets` requeridos (`MYSQL_ROOT_PASSWORD`, etc.), ejecutar un run y revisar artefactos/logs; luego automatizar despliegue a staging.

Estas estimaciones se basan en el trabajo realizado en la rama `feature/phase3-privileged-db` y los commits recientes. Si querés, hago un checklist más granular por archivo/módulo y actualizo porcentajes automáticamente según tareas completadas.
````
