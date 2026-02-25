Alinear completamente el modelo de datos del sistema con una única fuente de verdad estructural, eliminando parches temporales (vistas de compatibilidad), asegurando consistencia transaccional, estabilidad de migraciones y base sólida para escalabilidad horizontal, procesamiento de eventos y tiempo real.

El sistema debe quedar listo para operar en entorno productivo SaaS multi-tenant.

🧩 PROBLEMA A RESOLVER

Actualmente el sistema presenta:

Divergencia entre entidades ORM y esquema real de base de datos.

Uso de vistas SQL como capa de compatibilidad temporal.

Migraciones parcialmente aplicadas o marcadas manualmente.

Riesgo de inconsistencias en escritura de datos.

Base inestable para:

outbox pattern

eventos distribuidos

realtime

escalabilidad multi-instancia

Esto genera deuda técnica estructural crítica.

🧱 PRINCIPIO ARQUITECTÓNICO OBLIGATORIO

Debe existir UNA sola fuente de verdad del modelo de datos.

Elegir explícitamente:

A) Base de datos como modelo canónico
B) Entidades ORM como modelo canónico

No se permiten híbridos.

Recomendación: usar la base de datos como fuente canónica si existen datos reales persistidos.

🛠 PLAN DE EJECUCIÓN DETALLADO
FASE 1 — AUDITORÍA DEL ESQUEMA

Objetivo: detectar divergencias reales.

Tareas:

Generar diff estructural ORM vs DB.

Listar diferencias:

columnas faltantes

tipos incompatibles

índices

constraints

foreign keys

defaults

Documentar modelo actual real.

Entregable:
Documento “Schema Diff Report”.

FASE 2 — DEFINICIÓN DEL MODELO CANÓNICO

Objetivo: elegir modelo definitivo.

Tareas:

Analizar impacto en datos existentes.

Evaluar coherencia del DDL actual.

Tomar decisión formal.

Documentar estructura final.

Entregable:
Documento “Canonical Schema Definition”.

FASE 3 — ALINEACIÓN ESTRUCTURAL

Objetivo: que DB y ORM sean idénticos.

Si DB es fuente de verdad:

modificar entidades

ajustar relaciones

actualizar tipos

corregir nombres

alinear constraints

Si ORM es fuente de verdad:

crear migración transformacional segura

preservar datos

aplicar alteraciones progresivas

Entregable:
Código alineado + validación estructural.

FASE 4 — ELIMINACIÓN DE VISTAS DE COMPATIBILIDAD

Condición previa obligatoria:

ORM y tablas reales deben coincidir 100%.

Tareas:

eliminar vistas SQL

verificar lectura directa de tablas

validar operaciones CRUD completas

ejecutar tests E2E

Entregable:
Sistema sin capa de compatibilidad.

FASE 5 — MIGRACIÓN OFICIAL CANÓNICA

Objetivo: historial determinístico.

Tareas:

generar migración única de alineación

ejecutar en entorno limpio

ejecutar en entorno con datos

validar rollback

Entregable:
Migración reproducible y versionada.

FASE 6 — VALIDACIÓN TRANSACCIONAL

Objetivo: garantizar integridad real.

Verificar:

foreign keys efectivas

restricciones NOT NULL

unicidad

cascadas controladas

atomicidad de escritura

consistencia del outbox

Entregable:
Reporte de integridad.

FASE 7 — ESTABILIZACIÓN PARA SISTEMAS DISTRIBUIDOS

Solo después del alineamiento.

Implementar:

idempotencia de eventos

locking por procesamiento

retries exponenciales

dead letter queue

métricas por evento

trazabilidad completa

Entregable:
Outbox production-grade.

FASE 8 — VALIDACIÓN MULTI-TENANT

Verificar aislamiento:

claves foráneas por restaurante

filtros obligatorios

integridad de sesiones

consultas indexadas por tenant

Entregable:
Aislamiento garantizado.

FASE 9 — TESTING PROFUNDO

Obligatorio ejecutar:

migraciones desde cero

migraciones con datos

concurrencia

eventos paralelos

carga simultánea

Entregable:
Suite de regresión estable.

📊 CRITERIOS DE ÉXITO

El sistema será considerado estabilizado cuando:

✔ no existan vistas de compatibilidad
✔ migraciones sean determinísticas
✔ ORM refleje exactamente la DB
✔ outbox funcione sin duplicados
✔ operaciones concurrentes sean seguras
✔ datos mantengan integridad referencial
✔ sistema soporte múltiples instancias backend

🚫 RESTRICCIONES

No se permite:

modificar esquema manualmente en producción

mantener parches SQL ocultos

usar synchronize automático

escribir en vistas

migraciones no versionadas

📦 ENTREGABLE FINAL

Sistema backend con:

modelo de datos canónico documentado

migraciones determinísticas

outbox confiable

base lista para escalabilidad

arquitectura apta para SaaS multi-tenant

🔥 RESULTADO ESPERADO

Una plataforma estable, predecible y escalable que permita:

realtime confiable

consistencia de eventos

despliegue multi-instancia

evolución segura del esquema

crecimiento empresarial del producto