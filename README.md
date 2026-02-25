# ArisGourmet — estado actual y operación

## Objetivo del proyecto
Unificar el modelo de datos con **base de datos como única fuente de verdad**, eliminar dependencias de compatibilidad innecesarias, dejar migraciones determinísticas, habilitar `outbox` y `refresh_tokens`, y preparar el camino para SaaS multi-tenant.

## Estado actual
- **Backend**: alto avance. Migraciones y entidades alineadas; tablas `outbox` y `refresh_tokens` disponibles; pruebas E2E y carga moderada verdes.
- **Infra**: avanzado. DDL idempotente, scripts de operación y runbooks listos.
- **Frontend**: pendiente de validación E2E completa contra API canónica.

## Rama y PR
- Rama principal de trabajo: `feature/phase3-privileged-db`.
- PR en GitHub: creado como **Draft** para revisión de DBA/backend/ops.

## Archivos clave
- DDL idempotente: `infra/ddls/create_distributed_tables.sql`
- Migraciones: `backend/src/migrations/`
- Scripts operativos: `backend/scripts/`
- Runbooks: `backend/runbooks/`
- Checklist de release: `RELEASE_CHECKLIST.md`

## Comandos backend (quick start)
Desde la raíz del repo:

```powershell
cd backend
npm install
npm run migrate:run
npm run build
npm test --silent
npm run lint
```

Para desarrollo local:

```powershell
cd backend
npm run start:dev
```

## Recomendación operativa inmediata
1. Validar en staging con datos representativos.
2. Acordar ventana de mantenimiento (DBA/SRE) y backup completo.
3. Aplicar DDL + migraciones en producción con usuario autorizado.
4. Levantar worker/outbox y monitorear métricas (pendientes, retries, DLQ).
5. Ejecutar smoke tests post-despliegue.

## Notas
- Los comandos de backend fueron verificados localmente durante esta fase (migraciones, build y tests).
- El linter está activo para TypeScript en `backend/src/**/*.ts`.
