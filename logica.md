**Resumen Ejecutivo**

Este documento resume los avances realizados hasta la fecha en la tarea de "hardening" del backend y la puesta en marcha de DevOps (migraciones determinísticas, refresh tokens rotativos, patrón outbox, métricas, tests, CI) y la integración con el frontend + E2E. Incluye lo ya completado, los elementos pendientes, archivos claves modificados, acciones de seguridad realizadas y próximos pasos recomendados.

**Avances (Hecho)**
- **Branch & PR:** Se creó la rama `hardening/backend-devops`, se empujó al remoto y se abrió el PR número 1.
- **Migraciones:** Se añadió el DDL canónico en [infra/ddls/core_schema.sql](infra/ddls/core_schema.sql) y se implementó una migration TypeORM (`backend/src/migrations/0001-initial.ts`) que aplica ese DDL. Se corrigió la resolución de ruta en la migration para que encuentre `core_schema.sql` en entornos diversos.
- **Ejecución local de migraciones:** Las migraciones se ejecutaron localmente; resultado: no hay migraciones pendientes.
- **Secrets & .env:** Se removió `backend/.env` del control de versiones, se añadió `backend/.env.example` y se movió la contraseña de base de datos a `infra/.env` (archivo no trackeado). Además se rotó la contraseña localmente.
- **Infra local:** Actualizado [infra/docker-compose.yml](infra/docker-compose.yml) para leer credenciales desde `infra/.env` (env_file).
- **Hardening de código:** Se eliminaron defaults de contraseña hardcodeados en `backend/src/data-source.ts` y `backend/src/app.module.ts` para forzar lectura de variables de entorno.
- **Outbox / Worker / Auth:** Se implementaron y ajustaron piezas del outbox, refresh tokens rotativos y mejoras de autenticación (cambios en backend relevantes ya comprometidos).
- **Tests & Lint:** Se añadieron y/o ejecutaron tests unitarios con Jest (todos pasan) y ESLint (0 problemas). Commit incluidos.
- **CI:** Se añadió/modificó [.github/workflows/ci.yml](.github/workflows/ci.yml) para usar `${{ secrets.DB_PASS }}` en lugar de contraseñas hardcodeadas.
- **Secret en GitHub y re-run CI:** Se creó el secret `DB_PASS` en el repo mediante la API y se solicitó re-ejecución del job Playwright (E2E) asociado al PR.

**Pendientes / En progreso**
- **Re-ejecución Playwright E2E (PR):** Re-ejecución solicitada y actualmente en progreso/pendiente de finalización; hay que verificar el resultado del job y revisar logs si hay fallos.
- **(Opcional pero recomendado) Scrub del historial Git:** Eliminar cualquier credencial expuesta en commits pasados (usar `git-filter-repo` o BFG). Reescribe historia y requiere coordinación con colaboradores.
- **Revisar y ajustar E2E:** Si Playwright falla, adaptar tests/fixtures o ajustar infra para ambientes CI (timeouts, seeds, datos de prueba).
- **Revisar rotación de refresh tokens en producción:** Verificar políticas de expiración y revocación, añadir alertas si algo falla.

**Archivos modificados / añadidos clave**
- **Migration & DDL:** [backend/src/migrations/0001-initial.ts](backend/src/migrations/0001-initial.ts), [infra/ddls/core_schema.sql](infra/ddls/core_schema.sql)
- **Infra:** [infra/docker-compose.yml](infra/docker-compose.yml), [infra/.env](infra/.env) (local, sin trackear)
- **Backend env / docs:** [backend/.env.example](backend/.env.example), [backend/README.md](backend/README.md)
- **CI:** [.github/workflows/ci.yml](.github/workflows/ci.yml)
- **Scripts de apoyo:** [scripts/github-set-secret-and-rerun.js](scripts/github-set-secret-and-rerun.js)

**Acciones de seguridad realizadas**
- **No dejar secrets en repo:** `backend/.env` eliminado del index y añadido a `.gitignore`.
- **Rotación de credenciales:** Contraseña de DB rotada localmente y movida a `infra/.env` (archivo no versionado).
- **Secret en Actions:** `DB_PASS` añadido como secret del repositorio; CI usa ese secret.
- **Recomendación inmediata:** Revocar el PAT temporal usado para la automatización (si no lo has hecho ya).

**Próximos pasos recomendados**
- **Monitorear CI:** Esperar a que termine la ejecución Playwright y revisar logs; si falla, traer los logs relevantes y proceder a corregir.
- **(Opcional) Limpiar historial:** Planificar y ejecutar `git-filter-repo` o BFG para eliminar secretos históricos y comunicar a colaboradores cómo sincronar.
- **Documentar despliegue:** Añadir un pequeño apartado en [backend/README.md](backend/README.md) con cómo agregar secretos en GitHub Actions y cómo levantar infra local con `infra/.env`.
- **Revisar métricas:** Asegurar que métricas (instrumentación) estén desplegadas y que haya alertas mínimas.

**Notas / contexto adicional**
- La rama activa con todos estos cambios es `hardening/backend-devops` y el PR asociado es #1 en el remoto.
- Comandos útiles locales (ejemplo):

```powershell
cd infra
docker compose up -d mysql redis
cd ../backend
npm install
npm run migrate:run
npm test
```

Si quieres, puedo: 1) commitear y pushear este archivo `avances.md` (si aún no lo hice), 2) abrir/actualizar el PR con este documento, 3) monitorizar la ejecución del workflow Playwright y reportar resultados/logs. Dime qué prefieres que haga a continuación.
Avances del proyecto ArisGourmet
# Avances - ArisGourmet

Fecha: 2026-02-21

**Resumen breve**
- **Estado:** Desarrollo local estable con contenedores para `mysql`, `redis`, `backend` y `outbox-processor`. Frontend scaffold presente.
- **Alcance actual:** Backend funcional con autenticación JWT, refresh tokens (rotating), outbox para eventos, worker que publica a Redis, y métricas Prometheus básicas. CI básico y manifests K8s iniciales añadidos.

**Lo realizado (high-level)**
- **Arquitectura:** Documento de arquitectura entregado.
- **Infra local:** `infra/docker-compose.yml` con healthchecks y restart policies.
- **DB:** DDL inicial `infra/ddls/core_schema.sql` y migración TypeORM `0001-initial` creada.
- **Backend:** NestJS-style app con TypeORM; `synchronize` desactivado; entidades principales creadas incl. `refresh_tokens`, `outbox`.
- **Auth:** Registro/login con JWT, `RefreshService` implementado (rotación y revocación), endpoints `/auth/refresh` y `/auth/logout`.
- **Outbox:** Tabla `outbox`, worker `outbox-processor` que publica a Redis y marca eventos procesados.
- **Observability:** Prometheus metrics en backend (`/metrics`) y counters en worker.
- **CI/CD:** GitHub Actions workflow que instala deps y ejecuta migraciones (basic).
- **K8s:** Manifests iniciales en `infra/k8s` para backend y worker.

**Pendiente / Riesgos conocidos**
- Migraciones: el runner se añadió pero es necesario comprobar que la migración inicial se aplicó correctamente en tu entorno; hay casos donde la salida del contenedor no mostró el resultado final.
- Frontend: integración UI/flows (pedidos, creación de pedidos) no implementada.
- Realtime: gateway Socket.IO / adapters y contratos de eventos incompletos.
- Seguridad/Producción: refresco de tokens en cookies httpOnly + CSRF, TLS, secret management, y hardening pendientes.
- Observability: dashboards/alertas pendientes (Prometheus + Grafana).

**Cómo probar localmente (rápido)**
1. Levantar la infra desde la raíz del repo:

```bash
cd infra
docker compose up --build -d
```

2. Ver logs del backend:

```bash
docker compose logs -f backend
```

3. Comprobar tablas en MySQL:

```bash
docker compose exec mysql sh -c "mysql -uag_user -ps3cR3t-Ag!2026xQ7bTz -e 'USE arisgourmet; SHOW TABLES;'"
```

4. Ejecutar migraciones (si quieres forzar desde dentro del contenedor backend):

```bash
docker compose exec backend sh -c "npm install && npm run migrate:run"
```

5. Probar auth (registro/login/refresh/logout):

```bash
# register
curl -X POST http://localhost:4000/auth/register -H 'Content-Type: application/json' -d '{"email":"test@local","nombre":"Test","password":"secret","restaurante_id":1}'

# login
curl -X POST http://localhost:4000/auth/login -H 'Content-Type: application/json' -d '{"email":"test@local","password":"secret"}'

# refresh
curl -X POST http://localhost:4000/auth/refresh -H 'Content-Type: application/json' -d '{"refresh_token":"<token>"}'

# logout
curl -X POST http://localhost:4000/auth/logout -H 'Content-Type: application/json' -d '{"refresh_token":"<token>"}'
```

6. Ver métricas Prometheus:

```bash
curl http://localhost:4000/metrics
```

7. Ver logs del outbox worker:

```bash
docker compose logs -f outbox-processor
```

**Próximos pasos recomendados (prioritarios)**
- 1) Verificar y aplicar migraciones en el entorno (confirmar tablas). Si falta, ejecutar migración y corregir errores.
- 2) Implementar tests de integración (auth + refresh + outbox end-to-end).
- 3) Implementar gateway realtime (Socket.IO) y definir contratos de eventos.
- 4) Integrar secure cookie refresh token flow y CSRF protections.
- 5) Crear Helm charts + secreto gestionado (Vault/SecretsManager) y configurar Prometheus/Grafana dashboards.

Si quieres que ejecute alguno de los pasos prioritarios ahora (por ejemplo correr migraciones y validar tablas), dime cuál y lo hago.

Resumen del flujo actual del sistema:

- Infraestructura local (Docker Compose): MySQL, Redis, Backend (Node/Nest). Frontend scaffold pendiente.
- Backend (Nest-style + TypeORM): entidades core (Mesa, Producto, Pedido, ItemPedido, Usuario, Restaurante, etc.) y migraciones iniciales aplicadas.
- Multi-tenant: `TenantMiddleware` aplica `restauranteId` desde `x-restaurante-id` o parámetros.
- Autenticación: JWT implementado con `AuthModule`.
  - Endpoints: `POST /auth/register`, `POST /auth/login`.
  - Tokens: accesos firmados con `JWT_SECRET` (por defecto `dev-secret`).
- Guards y permisos:
  - Passport JWT (`JwtStrategy`) proporciona `req.user` con claims.
  - `@UseGuards(AuthGuard('jwt'))` protege rutas.
  - `Roles` decorator y `RolesGuard` añadidos para control por roles.
- Mesas API:
  - `GET /api/mesas` - devuelve mesas (filtrado por `restauranteId` si existe).
  - `POST /api/mesas/activate` - activa mesa (protegido por JWT).
  - `POST /api/mesas/release` - libera mesa (protegido por JWT + Roles `host|admin`).

Qué está funcionando (hecho):
- Contenedores arrancan: `mysql`, `redis`, `backend`.
- Migrations iniciales y sincronización ejecutadas.
- Endpoints básicos de `mesas` operativos.
- Registro/login (hash de contraseñas con `bcryptjs`) y generación de JWT.
- Guardas JWT y control de roles básico.

Verificaciones realizadas:
- Asigné role `host` al usuario `dev@local` y verifiqué `POST /api/mesas/release` con token JWT: respuesta `201` y la mesa pasó a `estado: libre`.

Qué falta por implementar (próximos pasos):
- Frontend Next.js y páginas: QR landing, menú, selección de pedido.
- Endpoints de menú (productos, disponibilidad) y pedidos (crear, validar stock, cambios de estado).
- WebSockets (Socket.io) para sincronización realtime entre cliente, host y cocina.
- Motor de estimación de tiempos por producto/pedido.
- Control de inactividad y liberación automática por timeout.
- Refresh tokens y gestión segura de sesiones (actualmente solo access tokens).
- CI/CD (GitHub Actions), backups de DB, y monitorización (Prometheus/Grafana).
- Mejor gestión de secretos (no usar `dev-secret` en producción), HTTPS y hardening de configuraciones.

Cómo probar localmente (resumen rápido):

1. Levantar servicios:

```bash
cd infra
docker compose up --build -d
```

2. Registrar y obtener token (ejemplo ya probado dentro del contenedor):

POST /auth/register { email,nombre,password }
POST /auth/login { email,password } -> devuelve `access_token`

3. Usar token para activar mesa:

POST /api/mesas/activate { codigo_qr }  Authorization: Bearer <token>

4. Liberar mesa (requiere rol `host` o `admin`):

POST /api/mesas/release { codigo_qr } Authorization: Bearer <token>

Notas y recomendaciones:
- Actualmente `synchronize: true` está activado en TypeORM para desarrollo. Antes de pasar a producción, generar migraciones formales y desactivar `synchronize`.
- Cambiar `JWT_SECRET` en `.env` y gestionar secretos con variables de entorno o un vault.
- Implementar refresh tokens y revocación (store en Redis) para sesiones más seguras.

Si quieres, procedo ahora a:
- Añadir roles de ejemplo (`host`) a un usuario existente y probar `release` desde `scripts/test-activate.js`, o
- Implementar refresh tokens + endpoint `/auth/refresh`.

Indica cuál preferir o si quieres que escriba documentación adicional en `avances.md` (más detalle técnico o diagramas).



PS C:\Users\alfon\Documents\Proyectos\ArisGourmet\infra> docker compose exec mysql sh -c "mysql -uag_user -pag_password -e 'USE arisgourmet; SHOW TABLES;'"
>> docker compose exec backend sh -c "npx ts-node ./scripts/run-migrations.ts"
time="2026-02-21T02:21:18-05:00" level=warning msg="C:\\Users\\alfon\\Documents\\Proyectos\\ArisGourmet\\infra\\docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
mysql: [Warning] Using a password on the command line interface can be insecure.
+-------------------------+
| Tables_in_arisgourmet   |
+-------------------------+
| evento                  |
| historial_estado_pedido |
| item_pedido             |
| mesa                    |
| mesa_sesion             |
| migrations              |
| notificacion            |
| pedido                  |
| permiso                 |
| producto                |
| restaurante             |
| role                    |
| role_permisos           |
| tiempo                  |
| usuario                 |
+-------------------------+
time="2026-02-21T02:21:19-05:00" level=warning msg="C:\\Users\\alfon\\Documents\\Proyectos\\ArisGourmet\\infra\\docker-compose.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
Error response from daemon: Container d5a9af464bf973a04e6726cc126b9f557dc7ca7658e0147fbc56b0cabdd6d702 is restarting, wait until the container is running
PS C:\Users\alfon\Documents\Proyectos\ArisGourmet\infra> 


**Resumen breve**
- **Estado:** Desarrollo local estable con contenedores para `mysql`, `redis`, `backend` y `outbox-processor`. Frontend scaffold presente.
- **Alcance actual:** Backend funcional con autenticación JWT, refresh tokens (rotating), outbox para eventos, worker que publica a Redis, y métricas Prometheus básicas. CI básico y manifests K8s iniciales añadidos.

**Lo realizado (high-level)**
- **Arquitectura:** Documento de arquitectura entregado.
- **Infra local:** `infra/docker-compose.yml` con healthchecks y restart policies.
- **DB:** DDL inicial `infra/ddls/core_schema.sql` y migración TypeORM `0001-initial` creada.
- **Backend:** NestJS-style app con TypeORM; `synchronize` desactivado; entidades principales creadas incl. `refresh_tokens`, `outbox`.
- **Auth:** Registro/login con JWT, `RefreshService` implementado (rotación y revocación), endpoints `/auth/refresh` y `/auth/logout`.
- **Outbox:** Tabla `outbox`, worker `outbox-processor` que publica a Redis y marca eventos procesados.
- **Observability:** Prometheus metrics en backend (`/metrics`) y counters en worker.
- **CI/CD:** GitHub Actions workflow que instala deps y ejecuta migraciones (basic).
- **K8s:** Manifests iniciales en `infra/k8s` para backend y worker.

**Pendiente / Riesgos conocidos**
- Migraciones: el runner se añadió pero es necesario comprobar que la migración inicial se aplicó correctamente en tu entorno; hay casos donde la salida del contenedor no mostró el resultado final.
- Frontend: integración UI/flows (pedidos, creación de pedidos) no implementada.
- Realtime: gateway Socket.IO / adapters y contratos de eventos incompletos.
- Seguridad/Producción: refresco de tokens en cookies httpOnly + CSRF, TLS, secret management, y hardening pendientes.
- Observability: dashboards/alertas pendientes (Prometheus + Grafana).


