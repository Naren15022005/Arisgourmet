# Backend - ArisGourmet

Este README contiene instrucciones rápidas para desarrollo local del backend.

Requisitos: Docker, Node 18+, npm

Levantar infra local:

```powershell
cd infra
docker compose up -d
```

Instalar dependencias y ejecutar migraciones:

```powershell
cd backend
npm install
npm run migrate:run
npm test
```

Variables de entorno: copia `backend/.env.example` a `backend/.env` y ajusta.

CI: [.github/workflows/ci.yml](.github/workflows/ci.yml) usa el secret `DB_PASS`.
