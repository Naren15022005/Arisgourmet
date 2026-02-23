**Flujo Actual**

- **Resumen breve:**
  - Infra local con MySQL y Redis; backend consolidado en `backend/src`. Se aplicaron parches temporales para que las entidades existentes funcionen contra la base de datos actual.

- **Infra y BD:**
  - `infra/docker-compose.yml` levanta MySQL (`infra-mysql-1`) y Redis. MySQL escucha en el host `3306` y usa credenciales: `aris_user` / `s3cr3t` (según `infra/.env`).
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
  - Pruebas E2E añadidas: `backend/src/__tests__/auth.e2e.spec.ts` (register/login/refresh/logout) y `backend/src/__tests__/mesas.e2e.spec.ts`.
  - Todos los tests locales pasan (ejecución actual: 2/2 tests pasan).
  - Cambios commiteados y *push* realizados en la rama `relocate-src-into-backend`.

- **Qué hace hoy el sistema (resumido):**
  - Levanta infra (MySQL+Redis) y el backend se conecta a la BD existente.
  - Vistas de compatibilidad permiten consultas desde entidades sin necesidad inmediata de refactorizar todas las entidades o la BD.
  - Endpoints básicos de auth funcionan con rotación de refresh tokens; pruebas E2E validan el flujo.

- **Pendientes y prioridades (recomendado):**
  1. Productivizar outbox worker: reintentos, idempotencia, DLQ y métricas. (Alta)
  2. WebSocket gateway usando Redis adapter para notificaciones en tiempo real. (Alta)
  3. Métricas y dashboards (Prometheus + Grafana). (Medio)
  4. Hardening de secretos: mover variables sensibles a Vault/Secret Manager y scrubbing si hay secretos en git. (Alta)
  5. Revisar esquema definitivo y decidir: migrar entidades o migrar DDL y eliminar vistas de compatibilidad. (Crítico)
  6. Completar E2E y CI (Playwright y workflows) para garantizar regresiones.

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

- **Backend: 45% completado**
  - Hecho: conexión a BD, migraciones básicas, vistas de compatibilidad aplicadas, rotación de refresh tokens implementada, outbox scaffold, pruebas E2E básicas y register compatible con vistas.
  - Pendiente: productivizar outbox (reintentos, idempotencia, DLQ), gateway WebSocket, métricas/observabilidad, Vault integration, reconciliación de esquema (eliminar vistas), más pruebas E2E/CI y despliegue/Helm.
  - Próximo paso recomendado: implementar retries/idempotencia + DLQ en outbox worker (reduce riesgo en producción).

- **Frontend: 20% completado**
  - Hecho: scaffolding del repositorio/infra (posible servicio en docker-compose), algunos ajustes de integración planificados.
  - Pendiente: implementar consumos de API (auth flows, notificaciones en tiempo real), UI para manejo de sesiones/mesas/pedidos, integración con WebSocket/Redis, pruebas E2E de usuario y despliegue frontend (CI/CD, hosting).
  - Próximo paso recomendado: definir rutas públicas y protected del frontend y prototipar flujo de login+refresh para validar la integración con el backend.

Estas estimaciones son cualitativas y se basan en el trabajo realizado hasta ahora; podemos afinar porcentajes si quieres que haga un checklist más granular por componente.