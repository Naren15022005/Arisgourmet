# PR: Privileged DB changes + CI for Phase 3

Branch: `feature/phase3-privileged-db`

Summary
- Adds a privileged SQL bundle to apply schema changes required for Phase 2 → Phase 3 migration.
- Adds a runbook and delivery instructions for the DBA.
- Adds a GitHub Actions workflow to run backend CI (MySQL + Redis) on PRs affecting `backend/`.

Files changed
- `backend/runbooks/PRIVILEGED_RUNBOOK.md` — runbook with steps, backup and rollback guidance.
- `backend/sql/privileged_changes.sql` — SQL to be executed by DBA (ALTER TABLE, CREATE TABLE, CREATE VIEW). Run as admin.
- `backend/runbooks/DELIVERY_TO_DBA.md` — suggested message and commands for the DBA.
- `backend/sql/post_privileged_checks.sql` — verification queries to run after the privileged bundle.
- `.github/workflows/backend-ci.yml` — CI workflow to validate migrations and tests in CI.

Why
- Some changes (ALTER TABLE, CREATE VIEW) require DB-admin privileges and cannot be run by low-privileged CI or the app users. This PR packages the SQL and instructions so the DBA can apply them in a controlled maintenance window.

How to review
1. Inspect `backend/sql/privileged_changes.sql` and confirm it matches your deployment policies. Note the file contains both `ADD COLUMN IF NOT EXISTS` and a prepared-statement fallback for older MySQL.
2. Confirm `refresh_tokens` schema and any desired constraints/indexes.
3. Confirm whether the compatibility views (`productos`, `mesas`, `roles`) should be created or omitted in production.
4. Review `.github/workflows/backend-ci.yml` to ensure CI credentials/secret names match your org policies.

Testing and verification (what I will do after DBA runs it)
- Run `backend/sql/post_privileged_checks.sql` as the DBA produced output and paste results here.
- Run `cd backend && npm run migrate:run && npm test` in CI or locally pointing to the updated DB.
- Start the worker and ensure it can process outbox messages and that `refresh_tokens` functionality works.

Rollback
- Use the backup created before applying changes (see `PRIVILEGED_RUNBOOK.md`) or use commented rollback statements in `privileged_changes.sql`.

Suggested reviewers
- `@db-admin` (DBA)
- `@backend-owner`

Notes
- I did not execute the privileged SQL on production; it awaits DBA execution. If you want me to run it now, provide a temporary admin connection string and I'll apply and verify.
