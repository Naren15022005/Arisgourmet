**DBA Instructions — Apply DDL & Grants**

Adjunto SQL idempotente a ejecutar por DBA si se requiere. Ejecutar como root/master en MySQL:

1) Crear/ajustar usuario con permisos mínimos:

```sql
CREATE USER IF NOT EXISTS 'db_admin'@'localhost' IDENTIFIED BY 'Secr3t';
CREATE USER IF NOT EXISTS 'db_admin'@'%' IDENTIFIED BY 'Secr3t';
GRANT CREATE, ALTER, DROP, INDEX, INSERT, UPDATE, DELETE, SELECT
  ON `arisgourmet`.* TO 'db_admin'@'localhost';
GRANT CREATE, ALTER, DROP, INDEX, INSERT, UPDATE, DELETE, SELECT
  ON `arisgourmet`.* TO 'db_admin'@'%';
FLUSH PRIVILEGES;
```

2) Aplicar DDL idempotente para tablas distribuidas:

- Archivo: `infra/ddls/create_distributed_tables.sql` (adjunto en el repo)

3) Validaciones post-DDL:

```sql
-- Verificar tablas
SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='arisgourmet' AND TABLE_NAME IN ('outbox','refresh_tokens');
-- Revisar estructura
SHOW CREATE TABLE refresh_tokens;
SHOW CREATE TABLE outbox;
```

4) Notificar al equipo Backend para ejecutar migraciones versionadas y validaciones E2E.

Nota: si su política prohíbe crear usuarios con host `%`, cree solo `db_admin`@'localhost' y comunique host/port exactos para el deploy.
