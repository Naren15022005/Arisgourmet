# Schema Diff Report — Plantilla

Proyecto: ArisGourmet
Fecha: <!-- YYYY-MM-DD -->

Resumen ejecutivo:

- Estado general del diff: (resumen corto)

Detalles:

1) Tablas faltantes en la BD (esperadas por ORM)

- `tabla_x`: columnas esperadas: ...

2) Tablas adicionales en BD (no modeladas por ORM)

- `tabla_y`: motivo/impacto

3) Columnas con tipos incompatibles

- `tabla.columna`: tipo en BD = ..., tipo en ORM = ...

4) Índices / Unicidad faltantes

- `tabla(idx)`:

5) Foreign keys / constraints faltantes o conflictivas

- `fk_nombre`:

6) Defaults / NOT NULL mismatches

- `tabla.columna`:

7) Observaciones / recomendaciones iniciales

- Recomendación: DB canónico / ORM canónico
- Riesgos inmediatos:

Acciones propuestas (próximos pasos):

- Generar migración transformacional si se elige ORM canónico.
- Modificar entidades si se elige DB canónico.
