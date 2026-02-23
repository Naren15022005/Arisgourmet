## Runbook: Privileged DB changes for Phase 2

Purpose: apply schema changes that require DB-admin privileges (ALTER / CREATE VIEW / CREATE TABLE) in a controlled, reversible way.

Prerequisites
- A DB user with these privileges on the `arisgourmet` database: `ALTER`, `CREATE VIEW`, `DROP`, `CREATE`, `INSERT`, and `SELECT` on `information_schema` (or full admin). Prefer a temporary deployer account.
- Take a full logical backup before applying (mysqldump or your backup tooling).

Files included in this bundle
- `../sql/privileged_changes.sql` — guarded SQL to execute.

High-level steps
1. Backup: run a full logical backup (example):

   mysqldump --single-transaction --routines --events --triggers -u ADMIN -p arisgourmet > arisgourmet-backup-YYYYMMDD.sql

2. Review SQL: inspect `backend/sql/privileged_changes.sql`. If MySQL version &lt; 8.0.16, the `ADD COLUMN IF NOT EXISTS` clauses may not be supported — see the "Compatibility" section below.

3. Apply changes (recommended via mysql client as admin):

   mysql -u ADMIN -p arisgourmet < backend/sql/privileged_changes.sql

4. Verify changes:

   - Confirm `outbox` has the new columns via information_schema.
   - Confirm `refresh_tokens` exists and has its indexes.
   - If compatibility views were created, run a quick `SELECT` from each.

5. Mark migrations (optional): to keep TypeORM migrations table in-sync, run `npm run migrate:run` as a deployer, or insert rows into the migrations table. Be careful — inspect the `migrations` table schema before inserting.

Rollback guidance

- Restore from the backup taken in step 1, OR run the rollback SQL included as commented sections in `privileged_changes.sql` (DROP VIEW, DROP COLUMN).

Compatibility

- If your MySQL version doesn't support `ADD COLUMN IF NOT EXISTS`, use the alternative conditional check block at the end of `privileged_changes.sql` (manual verification required).

Security notes

- Use a temporary admin/deployer account and revoke elevated privileges after the run.
- Do not store admin credentials in source control.

Contact

- If you want me to execute these steps, provide a temporary admin connection string and I will run and validate them; otherwise hand this bundle to your DBA and schedule a maintenance window.
