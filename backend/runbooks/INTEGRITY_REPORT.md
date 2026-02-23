# Integrity Report

Fecha: 2026-02-23

## Evidencia ejecutada
- Validación SQL: `backend/sql/phase_validation.sql`
- Suite de pruebas: `npm test --silent` en `backend` (pasa 2/2)

## Resultado por control

### 1) Vistas de compatibilidad
- Resultado: **OK**
- Evidencia: `compat_views_count = 0`

### 2) Esquema canónico singular
- Resultado: **OK**
- Tablas detectadas: `evento`, `historial_estado_pedido`, `item_pedido`, `mesa`, `mesa_sesion`, `notificacion`, `pedido`, `permiso`, `producto`, `restaurante`, `role`, `role_permisos`, `tiempo`, `usuario`.

### 3) Aislamiento multi-tenant estructural
- Resultado: **OK (estructural)**
- Columnas `restaurante_id` presentes en: `usuario`, `mesa`, `producto`, `pedido`, `item_pedido`, `tiempo`.

### 4) Integridad de autenticación y rotación
- Resultado: **OK funcional en local**
- `auth.e2e.spec.ts` valida login/refresh/rotación/revocación.
- En entorno restringido sin tabla `refresh_tokens`, se habilita fallback local controlado por `REFRESH_INMEMORY_FALLBACK` (no recomendado para producción).

### 5) Outbox distribuido
- Resultado: **Parcial / Bloqueado por privilegios de DB**
- Worker actualizado con retries exponenciales, DLQ, claim optimista, idempotencia Redis y métricas de proceso.
- Bloqueo: tabla `outbox` ausente y usuario local sin `CREATE TABLE`.

## Conclusión
- Integridad funcional del núcleo transaccional: **aprobada**.
- Integridad distribuida (`outbox`, `refresh_tokens`) requiere aprovisionamiento de tablas por usuario con privilegios para cierre total en producción.
