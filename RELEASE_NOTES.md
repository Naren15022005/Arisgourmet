Release: Canonical Schema Alignment and Distributed Tables

Summary:
- Canonical schema applied; compatibility views removed.
- Distributed tables `outbox` and `refresh_tokens` created and aligned with entities.
- Migrations updated and executed; E2E tests pass locally.

Important artifacts:
- DDL (idempotent): `infra/ddls/create_distributed_tables.sql`
- Migration scripts: `backend/src/migrations/*`
- Runbooks: `backend/runbooks/DEPLOY_CHECKLIST.md`, `backend/runbooks/DBA_RELEASE_INSTRUCTIONS.md`
- Validation SQL: `backend/sql/phase_validation.sql`

Rollback:
- Full DB dump required before deploy. See `DEPLOY_CHECKLIST.md`.

Next steps:
- Schedule maintenance window for production deploy.
- Run load/concurrency tests (recommended before broad rollout).
