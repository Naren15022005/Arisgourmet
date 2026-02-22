<<<<<<< HEAD
# Backend

Plan: Node.js + NestJS (API REST + WebSockets) con MySQL como base de datos.

Setup inicial (próximo):
- Crear proyecto NestJS en `backend/`
- Configurar ORM (TypeORM / Prisma) para MySQL
- Añadir Dockerfile y configuración para conectar a `infra` MySQL

# ArisGourmet

Backend (this folder)

Breve: API y worker para ArisGourmet, implementado en TypeScript.

Quick start:

1. From repository root, install backend deps:

```powershell
cd backend
npm install
```

2. Run migrations (requires local infra via docker-compose):

```powershell
npm run migrate:run
```

3. Start dev server:

```powershell
npm run start:dev
```

See `infra/docker-compose.yml` for local MySQL/Redis setup and `infra/ddls/core_schema.sql` for canonical schema.

» This README is maintained automatically during development tasks.

