-- Post-privileged checks to run after privileged_changes.sql
SELECT VERSION() AS mysql_version;
SELECT CURRENT_USER() AS ran_by;

-- Outbox columns
SELECT column_name, data_type, column_type
FROM information_schema.columns
WHERE table_schema = DATABASE() AND table_name = 'outbox' AND column_name IN ('attempts','last_error','next_retry_at','dlq','dlq_reason');

-- Refresh tokens existence
SELECT COUNT(*) AS refresh_tokens_exists FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='refresh_tokens';
SELECT column_name, data_type FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='refresh_tokens';

-- Views (if created) quick check
SELECT COUNT(*) FROM productos LIMIT 1;
SELECT COUNT(*) FROM mesas LIMIT 1;
SELECT COUNT(*) FROM roles LIMIT 1;

-- Optional: check TypeORM migrations table (if present)
SELECT COUNT(*) AS migrations_table_exists FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='migrations';
SELECT * FROM migrations ORDER BY timestamp DESC LIMIT 5;

-- Minimal smoke: list pending outbox items for processing (0..10)
SELECT id, topic, payload, attempts, next_retry_at, dlq FROM outbox ORDER BY created_at ASC LIMIT 10;
