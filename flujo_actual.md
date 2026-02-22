**Flujo Actual**

- **Estado Actual:**
  - **Infra:** `infra/docker-compose.yml` levanta servicios: MySQL (`infra-mysql-1`) y Redis; MySQL mapea puerto host `3306` y usa `MYSQL_USER=aris_user`, `MYSQL_PASSWORD=s3cr3t`, `MYSQL_DATABASE=arisgourmet`.
  - **BD:** La base `arisgourmet` existe con el DDL en `infra/ddls/core_schema.sql`.
  - **Compatibilidad:** Añadimos `infra/ddls/compat_views.sql` y lo aplicamos al contenedor para exponer vistas (`mesa`, `producto`, `pedido`, `item_pedido`, `usuario`) que emulan las tablas singulares que esperan las entidades actuales.
  - **Backend:** Código fuente consolidado en `backend/src`; migrations en `backend/src/migrations`; script de migraciones `scripts/run-migrations.ts` ajustado; `package.json` scripts apuntan a `backend/src`.
  - **Tests:** Ajusté la prueba de integración `backend/src/__tests__/mesas.e2e.spec.ts` para arrancar `AppModule` in-process; la prueba de Mesas ahora pasa contra la BD existente.

- **Qué hace hoy el sistema:**
  - Levanta servicios de infra (MySQL, Redis) con `docker compose` desde `infra/docker-compose.yml`.
  - El backend puede conectarse a la BD existente (`arisgourmet`) y las migraciones ya registradas no se re-ejecutan.
  - Las vistas de compatibilidad permiten que las entidades TypeORM actuales (que esperan tablas/columnas en singular y UUIDs/decimal) consulten la base con nombres/columnas diferentes.
  - Tests de integración básicos (Mesas) se ejecutan y pasan localmente.

- **Qué implementamos (resumen):**
  - DDL canónico: `infra/ddls/core_schema.sql`.
  - Docker compose para local infra: `infra/docker-compose.yml`.
  - Migration runner: `scripts/run-migrations.ts` y migraciones en `backend/src/migrations`.
  - Vistas de compatibilidad: `infra/ddls/compat_views.sql` (aplicado en MySQL).
  - Ajustes de repo y scripts: moví `src` a `backend/src`, actualicé `package.json` scripts y arreglé imports rotos.
  - Tests: integración in-process para `Mesas` y dependencias instaladas.
  - Documentos y scripts de apoyo: `tareas.md`, `logica.md`, varios scripts de administración.

- **Qué falta / pendiente (prioridad según mi criterio):**
  - Implementar rotación segura de refresh tokens (refresh token rotation).
  - Implementar worker de outbox para publicar eventos reliably.
  - Implementar gateway WebSocket con Redis (pub/sub) para notificaciones en tiempo real.
  - Añadir métricas (Prometheus) y dashboards (Grafana).
  - Hardening de secretos (Vault) y scrubbing del historial git si hay secretos expuestos.
  - Generar Helm charts / manifests k8s y runbooks de despliegue.
  - Completar cobertura de pruebas E2E y CI (Playwright si aplica).
  - Revisar y reconciliar esquema definitivo: reemplazar vistas de compatibilidad por migraciones o adaptar entidades (decisión estratégica).

- **Riesgos y notas:**
  - Las vistas de compatibilidad son un parche temporal; lo ideal es alinear entidades y DDL para evitar incoherencias en inserciones/constraints.
  - Algunos migrations/seed antiguos fueron marcados en la tabla `migrations` para evitar duplicados; verificar en staging si esto es aceptable.
  - Asegúrate de no subir `infra/.env` ni secrets al repo remoto.

- **Siguientes pasos recomendados (acción inmediata):**
  - Confirmas si dejar las vistas como solución temporal o prefieres alinear código↔esquema ahora.
  - Commitear `infra/ddls/compat_views.sql` y añadir nota en `infra/README.md` explicando su propósito (si decides mantenerlo).
  - Implementar outbox worker y refresh token rotation (prioridad alta para robustez).

- **Comandos útiles (ejecución local):**

```powershell
# Levantar infra (desde la raíz del repo)
docker compose -f infra/docker-compose.yml up -d --build

# Ejecutar migraciones (usa .env en repo raíz o infra/.env)
npm run migrate:run

# Ejecutar tests
npm test
```

---

Si querés, lo commiteo ahora y agrego un `infra/README.md` con instrucciones de uso y cómo revertir las vistas (o empiezo a convertir las vistas en migraciones definitivas).