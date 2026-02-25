Asunto: Solicitud: aplicar DDL canónico (crear `outbox` y `refresh_tokens`) en `arisgourmet`

Hola,

Necesitamos que el equipo DBA aplique el DDL mínimo para habilitar las tablas distribuidas necesarias para el patrón Outbox y la rotación de refresh tokens en la base de datos `arisgourmet`.

Resumen:
- Por qué: El backend fue alineado a un esquema canónico; las tablas `outbox` y `refresh_tokens` faltan en la instancia y requieren privilegios DDL para crearlas.
- Impacto: creación de tablas nuevas (idempotente). No modifica datos existentes.

Archivo con DDL (idempotente):
- `infra/ddls/create_distributed_tables.sql` (incluye `CREATE TABLE IF NOT EXISTS` para `outbox` y `refresh_tokens`).

Comando sugerido (ejecutar desde servidor DBA o cliente MySQL):

```sh
mysql -u <DB_ADMIN_USER> -p -h <DB_HOST> -P <DB_PORT> <DB_NAME> < infra/ddls/create_distributed_tables.sql
```

Ejemplo real (ajustar credenciales):

```sh
mysql -u db_admin -p -h db.example.com -P 3306 arisgourmet < infra/ddls/create_distributed_tables.sql
```

Pasos recomendados:
1) Hacer backup (ej. `mysqldump`) y validar copia.
2) Ejecutar el SQL anterior.
3) Comprobar que las tablas existen:

```sql
SHOW TABLES LIKE 'outbox';
SHOW TABLES LIKE 'refresh_tokens';
DESCRIBE outbox;
DESCRIBE refresh_tokens;
SELECT COUNT(*) FROM migrations;
```

4) Opcional (completar historial de migraciones y validar): desde el repositorio raíz ejecutar con credenciales DDL:

```powershell
.\backend\run_migrations_operator_noninteractive.ps1 -DbUser '<DB_ADMIN_USER>' -DbPassword '<PASS>' -DbHost '<DB_HOST>' -DbPort '3306' -DbName 'arisgourmet' -Backup
```

5) Verificación final: ejecutar la comprobación automatizada:

```powershell
$conn = "mysql://<DB_ADMIN_USER>:<PASS>@<DB_HOST>:3306/arisgourmet"
node backend/scripts/run_sql_url.js $conn sql/phase_validation.sql
```

Rollback
- Si se detecta algún problema, restaurar desde el backup creado en el paso 1.

Notas de seguridad
- No habilitar `REFRESH_INMEMORY_FALLBACK` en entornos de producción.
- Este DDL es idempotente y seguro para re-ejecución.

Contacto
- Si hay dudas, responder a este mensaje o contactarme por Slack/Teams para coordinar ejecución y verificación.

Gracias,
Equipo de plataforma
