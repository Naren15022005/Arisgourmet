**Flujo Actual**

- **Resumen breve:**
  - Infra local con MySQL y Redis; backend consolidado en `backend/src`. Se aplicaron parches y se corrigieron workflows de CI para que las migraciones y tests se ejecuten en orden.

- **Infra y BD:**
  - `infra/docker-compose.yml` levanta MySQL (`infra-mysql-1`) y Redis. MySQL escucha en el host `3306` y las credenciales deben gestionarse vía secretos (`infra/.env` solo para desarrollo).
  - El DDL canónico está en `infra/ddls/core_schema.sql`.
  - Aplicamos `infra/ddls/compat_views.sql` dentro del contenedor MySQL para exponer vistas (`mesa`, `producto`, `pedido`, `item_pedido`, `usuario`) que permiten compatibilidad con las entidades TypeORM actuales.

- **Backend (estado):**
  - Código en `backend/src`. Migrations en `backend/src/migrations`. Script de migraciones corregido: `scripts/run-migrations.ts`.
  - `AuthService` ahora crea `restaurantes`, `roles` y `usuarios` directamente en las tablas subyacentes cuando es necesario (evita fallos con vistas no actualizables).
  - Se añadió y/o adaptó: servicio de rotación de refresh tokens (`RefreshService` / `refresh-token` logic), scaffolding del worker de outbox, y ajustes para tests.

- **Lo implementado recientemente:**
  - Rotación de refresh tokens (endpoints y `RefreshService`) y flujo de revocación.
  - Scaffolding del outbox processor (`backend/src/workers/outbox-processor.ts`).
  - Ajuste en `AuthService.register` para insertar en tablas subyacentes y devolver el usuario a través del repositorio (compatibilidad con vistas).
  - Pruebas E2E añadidas para auth/mesas en `backend/src/__tests__`.
  - Migración de seeds reordenada: renombrada la migración seed para ejecutarse después del DDL que crea `restaurante`.
  - CI: workflows corregidos y limpiados (`.github/workflows/backend-ci.yml`, `.github/workflows/ci.yml`): alineación de env vars, eliminación de pasos ruidosos, caching de npm, unificación de Redis, y eliminación del workflow de smoke.
  - Eliminados `gh-logs/` del repo y añadidos a `.gitignore`.

- **Qué hace hoy el sistema (resumido):**
  - Levanta infra (MySQL+Redis) y el backend se conecta a la BD existente.
  - Vistas de compatibilidad permiten consultas desde entidades sin necesidad inmediata de refactorizar todas las entidades o la BD.
  - Endpoints básicos de auth funcionan con rotación de refresh tokens; pruebas E2E validan el flujo.

- **Pendientes y prioridades (recomendado):**
  1. Productivizar outbox worker: reintentos, idempotencia, DLQ y métricas. (Alta)
  2. Ejecutar pipeline completo en GitHub Actions y revisar logs (validar que migrations+tests pasen en remoto). (Inmediato)
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
- abrir un PR desde `relocate-src-into-backend` a `main` (necesita `gh` o hacerlo por la web),
- o seguir con la siguiente prioridad: productivizar el outbox worker. Indica cuál prefieres.
**Estado de Frontend y Backend (porcentaje aproximado)**

- **Backend: 75% completado**
  - Hecho: conexión a BD robustecida, migraciones reordenadas (seed corrige orden), migraciones y build en workflows, caching de npm, tests locales y E2E básicos, renombrado y limpieza de workflows, secrets planificados.
  - Pendiente: productivizar outbox (reintentos, idempotencia, DLQ), observabilidad (metrics + logs), revisión final del esquema (eliminar vistas), validación completa del pipeline remoto y despliegue automatizado (Helm/infra-as-code).
  - Próximo paso recomendado: ejecutar y validar el pipeline CI completo en GitHub Actions; si pasa, proceder con outbox retries + DLQ.

- **Frontend: 20% completado**
  - Hecho: scaffolding y planificación de integración.
  - Pendiente: implementación de UI de auth y manejo de sesiones, integración con WebSocket/Redis, pruebas E2E de usuario y CI/CD de frontend.
  - Próximo paso recomendado: prototipar flujo de login+refresh y probar integración con backend en entorno staging.

- **Infra / CI: 80% completado**
  - Hecho: workflows principales corregidos (`backend-ci.yml`, `ci.yml`), variables de entorno alineadas con `data-source.ts`, agregado cache de npm, unificación de Redis versión, eliminación de pasos ruidosos y smoke workflow, `.gitignore` actualizado para `gh-logs/`.
  - Pendiente: mover credenciales a `secrets`, validar ejecución completa de migraciones y tests en GitHub (monitor CI runs), instrumentar observabilidad para runners/infra, y hardening de seguridad (rotación de secretos, acceso restringido).
  - Próximo paso recomendado: crear los `secrets` requeridos (`MYSQL_ROOT_PASSWORD`, etc.), ejecutar un run y revisar artefactos/logs; luego automatizar despliegue a staging.

Estas estimaciones se basan en el trabajo realizado en la rama `feature/phase3-privileged-db` y los commits recientes. Si querés, hago un checklist más granular por archivo/módulo y actualizo porcentajes automáticamente según tareas completadas.