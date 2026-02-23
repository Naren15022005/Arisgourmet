# Auditoría de esquema (Phase 1)

Objetivo: generar un "Schema Diff Report" que liste diferencias entre el modelo ORM (entidades TypeORM) y la base de datos real `arisgourmet`.

Acciones recomendadas (pasos):

1. Preparar entorno
   - Asegúrate de que MySQL esté accesible y que `infra/.env` o el `.env` del repo contenga las credenciales.
   - Variables usadas por el script ejemplo: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

2. Exportar esquema de la base de datos
   - Comando recomendado (si tienes `mysqldump`):

```bash
mysqldump --no-data --skip-comments --compact -u $DB_USER -p$DB_PASSWORD -h $DB_HOST $DB_NAME > infra/schema_audit/db_schema.sql
```

   - Alternativa: ejecutar `SHOW CREATE TABLE` para tablas relevantes (ver `scripts/schema_audit.ts`).

3. Extraer metadatos ORM
   - Generar un listado de entidades y sus columnas a partir del código (`backend/src/entities`).
   - El script `scripts/schema_audit.ts` provee un punto de partida para comparar `information_schema` vs la definición esperada.

4. Generar el "Schema Diff Report"
   - Usar la plantilla `infra/schema_audit/schema-diff-report-template.md` para documentar:
     - Tablas/columnas faltantes
     - Tipos incompatibles
     - Índices y constraints faltantes
     - Foreign keys conflictivas
     - Defaults/NULL mismatch

5. Análisis y decisión
   - Con el reporte en mano, proponemos: (A) DB canónico o (B) ORM canónico.
   - Documentar impactos y plan de migración.

Checklist rápido (entregables Phase 1):
- `infra/schema_audit/db_schema.sql` (dump esquema, opcional)
- `infra/schema_audit/schema-diff-report.md` (report final)
- `scripts/schema_audit.ts` (script ejecutable para extracción básica)

Si quieres, ejecuto el script plantilla para producir un primer JSON con metadatos (necesito que confirmes que la BD local está arriba y accesible desde aquí). 
