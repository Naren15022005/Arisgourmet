Outbox processor

- Purpose: continuous processor that publishes `outbox` events to Redis channels and marks them processed.

Env vars

- `REDIS_URL` (default: `redis://localhost:6379`)
- `OUTBOX_MAX_ATTEMPTS` (default: `5`)
- `OUTBOX_BASE_BACKOFF_SEC` (default: `60`)
- `OUTBOX_BATCH_SIZE` (default: `10`)

Run locally

1. Start Redis locally (or point `REDIS_URL` to a reachable Redis).
2. Use the `copilot` DB user or a DB user with privileges to run migrations if you want schema changes applied.

Commands (from project root):

```powershell
cd backend
# start worker in foreground
npm run start:worker
# or run via ts-node directly
npx ts-node ./src/workers/outbox-processor.ts
```

Migrations

- A migration file `backend/src/migrations/1771802000000-add_outbox_retry_columns.ts` was added to create `attempts`, `last_error`, and `next_retry_at` columns in the `outbox` table.
- To apply it, run (requires a DB user with ALTER privileges):

```powershell
cd backend
# set DB env vars, or update backend/.env
$env:DB_USER='your_admin'
$env:DB_PASSWORD='...'
npm run migrate:run
```

Notes

- The worker is idempotent and uses exponential backoff; once `attempts >= OUTBOX_MAX_ATTEMPTS` the row is marked processed (acts as DLQ marker). You can change that behavior to move rows to a dedicated DLQ table by editing `src/workers/outbox-processor.ts`.
- Tests and code include fallbacks so local dev can run without migration privileges (in-memory fallback for refresh tokens when DB table is missing).
