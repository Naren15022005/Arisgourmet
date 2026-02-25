## Delivery package for DBA

Purpose: provide the DBA with the minimal, safe bundle to apply privileged schema changes required for Phase 2.

Included files (relative to repo root)
- `backend/sql/privileged_changes.sql` — the SQL bundle to run as DB admin.
- `backend/runbooks/PRIVILEGED_RUNBOOK.md` — runbook with steps, backup and rollback guidance.
- `backend/sql/post_privileged_checks.sql` — verification SQL to run after changes.

Suggested message to DBA (copy into email or ticket):

Subject: Request to apply Phase-2 privileged DB changes for `arisgourmet`

Hi,

Please run the attached SQL bundle on the `arisgourmet` database during a maintenance window. The bundle will:
- Add retry/DLQ columns to the `outbox` table used by the background worker.
- Create a `refresh_tokens` table used by rotating refresh tokens.
- (Optional) Create compatibility views (`productos`, `mesas`, `roles`) to ease the transition.

Files: `backend/sql/privileged_changes.sql` and `backend/runbooks/PRIVILEGED_RUNBOOK.md`.

Run commands (example):

```sh
mysqldump --single-transaction --routines --events --triggers -u ADMIN -p arisgourmet > arisgourmet-backup-YYYYMMDD.sql
mysql -u ADMIN -p arisgourmet < backend/sql/privileged_changes.sql
mysql -u ADMIN -p arisgourmet < backend/sql/post_privileged_checks.sql
```

Verification checklist (what I will do after you run it):
- Confirm `outbox` has columns: `attempts`, `last_error`, `next_retry_at`, `dlq`, `dlq_reason`.
- Confirm `refresh_tokens` table exists and has indexes.
- If views created: run `SELECT COUNT(*)` on each view.
- Run backend migrations and tests: `cd backend && npm run migrate:run && npm test`.

Rollback instructions are in `backend/runbooks/PRIVILEGED_RUNBOOK.md`.

Please reply here when complete and paste the output of the post-checks so I can finish verification and start Phase 3.

Thanks,

-- Dev team
