# Tareas derivadas de `logica.md` y `idea.md`

Este documento lista las tareas accionables extraídas de los documentos de diseño y avances (`logica.md`, `idea.md`). Prioriza seguridad, migraciones, CI, observability y la puesta en marcha de la arquitectura propuesta.

- Monitorizar ejecución Playwright E2E en CI y revisar logs (PRs/Workflows).
- Verificar que las migraciones se aplicaron correctamente en `infra/ddls/core_schema.sql` y con la migration `backend/src/migrations/0001-initial.ts`.
- Ejecutar tests unitarios e integración en `backend` y arreglar fallos (Jest/ESLint).
- Implementar/validar refresh tokens rotativos y su revocación (`/auth/refresh`, `refresh_tokens` table).
- Implementar el patrón Outbox y el worker (`outbox` table + `outbox-processor`).
- Implementar WebSocket gateway escalable con Redis adapter (rooms por restaurante/mesa/cocina).
- Añadir métricas Prometheus y dashboards Grafana; exponer `/metrics` en backend.
- Hardening y gestión de secretos: mover secretos a `infra/.env` local y plan para `Vault`/SecretsManager.
- Scrub del historial Git para eliminar credenciales expuestas (plan `git-filter-repo`/BFG) y coordinar con colaboradores.
- Crear Helm charts y manifests Kubernetes en `infra/k8s` para producción (autoscaling, LB, probes).
- Documentar despliegue y runbooks en `backend/README.md` y `infra/README.md` (incluyendo cómo añadir secrets en Actions).
- Añadir pipeline CI/CD para build, migraciones, tests y despliegue (ver `.github/workflows/ci.yml`).
- Revisar y aplicar políticas de seguridad HTTP: CORS, headers, cookies httpOnly para refresh tokens, CSRF.
- Revoke/rotate cualquier PAT temporal usado para automatización.

Prioridades inmediatas (recomendadas):
1. Monitorizar CI Playwright y resolver fallos (si existen).
2. Verificar y aplicar migraciones en entorno local (docker compose) y confirmar tablas.
3. Implementar refresh tokens rotativos y endpoints de revocación.
4. Añadir observability mínima (`/metrics`) y alertas básicas.

Si quieres, hago commits de `tareas.md` en la rama `hardening/backend-devops`, actualizo el PR y empiezo con la tarea 1 (monitor CI). ¿Cómo procedo?