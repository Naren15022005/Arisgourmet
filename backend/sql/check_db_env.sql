SELECT VERSION() AS version;
SELECT CURRENT_USER() AS current_user;
SHOW GRANTS FOR CURRENT_USER();
SELECT COUNT(*) AS has_outbox FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='outbox';
SELECT GROUP_CONCAT(column_name ORDER BY ordinal_position) AS outbox_columns FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='outbox';
