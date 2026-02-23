Instrucciones para ejecutar las migraciones canónicas (operador)

Propósito: materializar la migración canónica que crea las tablas distribuidas (outbox, refresh_tokens) y asegurar que la base de datos quede en el estado canónico definido en el repositorio.

PRECONDICIONES
- Tener un usuario de base de datos con privilegios DDL (CREATE, ALTER, DROP, INDEX) sobre la base arisgourmet.
- Hacer backup completo antes de ejecutar migraciones en producción.
- Tener acceso al repositorio y poder ejecutar comandos en la carpeta backend.
- Node.js y npm instalados en el servidor de despliegue.

RECOMENDADO
- Ejecutar en ventana de mantenimiento con baja actividad.
- Probar primero en staging/replica antes de producción.

PASOS (resumen rápido)

1) Crear backup (ejemplo mysqldump) y verificar copia.
2) Ejecutar migraciones con el usuario DDL:

Ejemplo de comandos (ajustar valores):

```powershell
cd \path\to\repo\backend
Set-Item Env:DB_USER "db_admin"
Set-Item Env:DB_PASSWORD "<password>"
Set-Item Env:DB_HOST "db-host"
Set-Item Env:DB_PORT "3306"
Set-Item Env:DB_NAME "arisgourmet"
npm run migrate:run
```

3) Validar que las tablas outbox y refresh_tokens existen y que la migración marcó la versión en la tabla migrations.

Verificación rápida (desde el root del repo):

```powershell
$conn = "mysql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/<DB_NAME>"
node scripts/run_sql_url.js $conn sql/phase_validation.sql
```

Salida esperada (parámetros clave):
- missing_distributed_tables: vacío o [].
- compat_views_count: 0.

ROLLBACK / DESHACER
- Si la migración crea tablas nuevas, revertirlas puede requerir una migración inversa. Use npm run migrate:revert si está disponible o aplique un script SQL manual para eliminar las tablas creadas.
- Restaurar desde backup si se detecta corrupción de datos.

ALTERNATIVA MANUAL
- Ejecutar el DDL canónico que está en infra/ddls/core_schema.sql (o extraer solo las definiciones de outbox y refresh_tokens) usando el cliente MySQL con el usuario DDL.

DDL mínimo para DBA
-------------------
Se ha añadido `infra/ddls/create_distributed_tables.sql` con un DDL idempotente que crea sólo las tablas distribuidas `outbox` y `refresh_tokens`. El DBA puede ejecutar:

```powershell
mysql -u <DB_USER> -p -h <DB_HOST> -P <DB_PORT> <DB_NAME> < infra/ddls/create_distributed_tables.sql
```

Después de ejecutar ese SQL, puedes volver a correr el script de migraciones no interactivo o el runner de migraciones para completar el historial de migraciones.

NOTAS DE SEGURIDAD
- No usar el fallback en memoria de refresh tokens en producción. Asegurarse de que la variable de entorno REFRESH_INMEMORY_FALLBACK esté desactivada en env de producción.


Non-interactive script
-----------------------

Se ha añadido `backend/run_migrations_operator_noninteractive.ps1`, que permite ejecutar todo en modo no interactivo (ideal para CI o para que el operador lo invoque con parámetros). Ejemplo:

```powershell
.\backend\run_migrations_operator_noninteractive.ps1 -DbUser 'db_admin' -DbPassword 'Secr3t' -DbHost 'db-host' -DbPort '3306' -DbName 'arisgourmet' -Backup
```

El script realiza opcionalmente un `mysqldump`, ejecuta `npm run migrate:run` en `backend` y lanza la verificación `sql/phase_validation.sql`.
