# PROMPT MAESTRO — ARQUITECTURA PROFESIONAL ARISGOURMET

Actúa como **arquitecto de software senior especializado en sistemas SaaS de alta concurrencia en tiempo real**, con experiencia en POS, sistemas de pedidos, microservicios y despliegue cloud escalable.

Tu tarea es diseñar, mejorar y profesionalizar completamente el sistema **ArisGourmet**, asegurando robustez, escalabilidad, seguridad, mantenibilidad y operación en producción real con múltiples restaurantes simultáneos.

NO simplifiques decisiones técnicas.
NO propongas soluciones básicas.
TODO debe ser producción real.

---

# 1. CONTEXTO DEL SISTEMA

ArisGourmet es un sistema SaaS multi-tenant para restaurantes que permite:

* pedidos desde QR en mesa
* menú digital
* gestión de mesas activas
* sincronización en tiempo real cliente / cocina / recepción
* control de estados de pedido
* gestión de usuarios por roles
* control de tiempos de atención
* liberación automática de mesas por inactividad

Arquitectura actual:

* Frontend → Next.js
* Backend → Node.js + NestJS
* Base de datos → MySQL
* Cache / realtime → Redis
* Infra → Docker Compose local
* Auth → JWT
* Multi-tenant por restauranteId
* WebSockets pendientes
* Sistema de pedidos en desarrollo

Objetivo: sistema SaaS nacional escalable.

---

# 2. OBJETIVO DE ESTA ARQUITECTURA

Transformar el sistema actual en:

✔ Arquitectura lista para producción
✔ Soporte multi restaurante simultáneo
✔ Alta concurrencia sin bloqueos
✔ Respuesta en tiempo real confiable
✔ Despliegue cloud automatizado
✔ Observabilidad completa
✔ Seguridad empresarial
✔ Escalabilidad horizontal
✔ Alta disponibilidad
✔ Recuperación ante fallos

---

# 3. ENTREGABLES QUE DEBES GENERAR

Diseña TODO lo necesario y explica cada decisión técnica.

Debes entregar:

## 3.1 Arquitectura del sistema completa

* diagrama general
* diagrama de servicios
* diagrama de flujo de pedidos realtime
* separación de responsabilidades
* modelo multi-tenant robusto

---

## 3.2 Infraestructura profesional Docker / Cloud

Diseñar:

* docker-compose producción
* redes internas
* volúmenes persistentes
* health checks
* orden de arranque controlado
* variables de entorno seguras
* reverse proxy (Nginx)
* HTTPS
* rate limiting
* logs estructurados

Luego versión cloud:

* Kubernetes arquitectura
* auto scaling
* balanceadores de carga
* alta disponibilidad
* backups automáticos
* disaster recovery

---

## 3.3 Diseño backend enterprise (NestJS)

Arquitectura modular:

* módulos por dominio
* capa aplicación
* capa dominio
* capa infraestructura
* repositorios
* eventos de dominio
* CQRS (si aplica)

Diseñar:

* gestión de pedidos concurrentes
* control transaccional
* idempotencia
* locking optimista o pesimista
* consistencia eventual
* motor de eventos

---

## 3.4 Sistema de comunicación en tiempo real

Diseñar WebSockets profesionales:

* gateway arquitectura
* rooms por restaurante
* rooms por mesa
* rooms por cocina
* control de reconexión
* manejo de eventos perdidos
* sincronización estado cliente
* escalabilidad horizontal con Redis adapter

Definir contratos de eventos:

* pedido creado
* pedido aceptado
* pedido preparando
* pedido listo
* mesa activada
* mesa liberada
* sesión expirada

Definir payloads JSON exactos.

---

## 3.5 Modelo de base de datos profesional

Diseñar:

* esquema normalizado
* índices críticos
* relaciones
* auditoría de cambios
* historial de estados
* soft deletes
* timestamps automáticos
* particionamiento si aplica

Optimización para:

* alta concurrencia
* lectura rápida
* consultas en tiempo real

---

## 3.6 Sistema de sesiones de mesa

Diseñar:

* lifecycle sesión
* expiración automática
* detección de inactividad
* worker de limpieza
* recuperación de sesión caída
* consistencia entre Redis y DB

---

## 3.7 Seguridad enterprise

Diseñar:

* refresh tokens
* revocación de tokens
* almacenamiento seguro sesiones
* rate limiting por IP
* protección fuerza bruta
* CORS estricto
* headers seguridad HTTP
* protección XSS
* protección CSRF
* encriptación datos sensibles
* gestión de secretos (vault)

---

## 3.8 Sistema de roles y permisos RBAC completo

Diseñar:

* roles
* permisos granulares
* asignación dinámica
* middleware autorización
* guard por permisos
* auditoría acciones

---

## 3.9 Sistema de observabilidad completo

Diseñar:

* métricas Prometheus
* dashboards Grafana
* tracing distribuido
* logs centralizados
* alertas automáticas
* monitoreo performance

---

## 3.10 Estrategia de despliegue CI/CD

Diseñar pipeline:

* build automático
* pruebas automatizadas
* análisis seguridad
* versionado imágenes
* despliegue blue/green
* rollback automático

---

## 3.11 Estrategia de pruebas profesionales

Definir:

* pruebas unitarias
* pruebas integración
* pruebas carga
* pruebas concurrencia
* pruebas resiliencia

---

## 3.12 Estrategia de escalabilidad futura

Planificar:

* miles de restaurantes
* picos simultáneos pedidos
* regiones geográficas
* separación por shards
* multi base de datos

---

# 4. FORMATO DE RESPUESTA ESPERADO

Responder en este orden:

1 arquitectura general
2 infraestructura
3 backend
4 realtime
5 base datos
6 seguridad
7 escalabilidad
8 observabilidad
9 despliegue
10 riesgos técnicos
11 roadmap implementación por fases

Todo extremadamente detallado.

---

# 5. CRITERIO DE CALIDAD

La solución debe ser:

* mantenible 10 años
* escalable globalmente
* tolerante a fallos
* sin single points of failure
* lista para producción real

---

# 6. REGLA FINAL

No propongas alternativas simples.
No omitas componentes críticos.
Diseña como si fuera a soportar miles de restaurantes simultáneamente.

---

Genera la arquitectura completa ahora.
