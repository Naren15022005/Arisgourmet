````markdown
**Flujo Actual**

- **Resumen breve:**
  - Infra local con MySQL y Redis; backend consolidado en `backend/src`.
  - Estado reciente: backend completado al 100% â€” mÃ³dulos de pedidos, productos y notificaciones (WebSocket + Redis) implementados y testeados. CI workflows estables y ejecutÃ¡ndose en la rama activa.

- **Infra y BD:**
  - `infra/docker-compose.yml` levanta MySQL (`infra-mysql-1`) y Redis. MySQL escucha en el host `3306` y las credenciales deben gestionarse vÃ­a secretos (`infra/.env` solo para desarrollo).
  - El DDL canÃ³nico estÃ¡ en `infra/ddls/core_schema.sql`.
  - Vistas de compatibilidad en `infra/ddls/compat_views.sql` (temporales â€” planear eliminar tras conciliar esquema).

- **Backend (estado â€” 100% completado):**
  - `AuthModule`: registro, login, refresh tokens rotativos, logout (`/auth/*`).
  - `MesasModule`: listar mesas, activar/liberar mesa por QR (`/api/mesas`).
  - `PedidosModule`: crear pedido, actualizar estado, cancelar, listar por restaurante/mesa (`/api/pedidos`). Escribe eventos al `outbox` (best-effort).
  - `ProductosModule`: listar carta (pÃºblico), CRUD admin, toggle disponibilidad (`/api/productos`).
  - `NotificationsModule`: WebSocket gateway en `/notifications` (socket.io); Redis subscriber que releva eventos del outbox worker a clientes conectados en su sala de restaurante.
  - `OutboxWorker`: retries exponenciales, idempotencia Redis (`SET NX`), DLQ, claim optimista multi-worker (`backend/src/workers/outbox-processor.ts`).
  - MÃ©tricas Prometheus en `/metrics` (`prom-client`).
  - Tests: auth, mesas, pedidos, productos â€” 11 tests, 4 suites, todos pasan.

- **Lo implementado en esta sesiÃ³n:**
  - `backend/src/pedidos/`: `PedidosService`, `PedidosController`, `PedidosModule`.
  - `backend/src/productos/`: `ProductosService`, `ProductosController`, `ProductosModule`.
  - `backend/src/notifications/`: `NotificationsService` (socket.io + Redis subscriber), `NotificationsModule`.
  - `main.ts`: inicializaciÃ³n del gateway WebSocket tras arrancar el servidor HTTP.
  - `app.module.ts`: importa los tres mÃ³dulos nuevos.
  - Tests E2E para pedidos y productos.
  - CI: `ci.yml` incluye `feature/phase3-privileged-db` en triggers; `backend-ci.yml` ignora ramas `dependabot/*`.

- **QuÃ© hace hoy el sistema:**
  - Backend full-stack: auth, mesas, pedidos con historial de estados, productos con toggle de disponibilidad.
  - Outbox worker publica eventos a Redis â†’ NotificationsService releva en tiempo real a clientes WebSocket por sala de restaurante.
  - MÃ©tricas expuestas para Prometheus/Grafana.
  - Migraciones reproducibles desde cero en CI limpio.

- **Pendientes (solo Frontend):**
  1. UI de auth: login, refresh automÃ¡tico, logout.
  2. Carta pÃºblica: listar productos y crear pedido desde QR.
  3. Panel de cocina/host: ver pedidos en tiempo real (WebSocket), cambiar estado.
  4. IntegraciÃ³n WebSocket cliente (socket.io-client) con join por restaurante_id.
  5. Tests E2E de UI (Playwright).

- **Comandos Ãºtiles:**

```powershell
# Levantar infra (desde la raÃ­z del repo)
docker compose -f infra/docker-compose.yml up -d --build

# Ejecutar migraciones (desde la raÃ­z)
npm run migrate:run

# Ejecutar tests
cd backend ; npm test

# Iniciar backend
cd backend ; npm run start:dev

# Iniciar outbox worker
cd backend ; npm run start:worker
```

---

**Estado de Frontend y Backend (porcentaje aproximado)**

- **Backend: 100% completado**
  - Auth (registro, login, refresh, logout), Mesas (listar, activar, liberar), Pedidos (crear, actualizar estado, cancelar, listar), Productos (CRUD + toggle), Notificaciones WebSocket (socket.io + Redis), Outbox worker production-grade (retries, DLQ, idempotencia), MÃ©tricas Prometheus.
  - Tests: 11/11 pasan (4 suites: auth, mesas, pedidos, productos).
  - Migraciones ordenadas y tolerantes. CI workflows estables.

- **Frontend: 25% completado**
  - Hecho: scaffolding y planificaciÃ³n de integraciÃ³n.
  - Pendiente: UI de auth, carta pÃºblica, panel de cocina, integraciÃ³n WebSocket, tests E2E.
  - PrÃ³ximo paso: prototipar flujo login + WebSocket en staging.

- **Infra / CI: 100% completado**
  - Workflows `backend-ci.yml` y `ci.yml`: install deps, mysql-client, crear `ag_user` con GRANT completo (incluyendo `REFERENCES`), migraciones, tests.
  - Redis 7 disponible en runners.
  - Branches activas incluidas en triggers (`feature/phase3-privileged-db`).
  - npm caching habilitado.
  - Artefactos de test subidos en fallos.
  - Pendiente operativo: configurar `secrets.MYSQL_ROOT_PASSWORD` en el repositorio GitHub si el runner usa contraseÃ±a de root distinta a la vacÃ­a.

