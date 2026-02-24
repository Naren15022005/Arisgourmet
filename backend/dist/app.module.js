"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const mesa_entity_1 = require("./entities/mesa.entity");
const producto_entity_1 = require("./entities/producto.entity");
const pedido_entity_1 = require("./entities/pedido.entity");
const item_pedido_entity_1 = require("./entities/item-pedido.entity");
const usuario_entity_1 = require("./entities/usuario.entity");
const evento_entity_1 = require("./entities/evento.entity");
const tiempo_entity_1 = require("./entities/tiempo.entity");
const restaurante_entity_1 = require("./entities/restaurante.entity");
const role_entity_1 = require("./entities/role.entity");
const permiso_entity_1 = require("./entities/permiso.entity");
const sesion_mesa_entity_1 = require("./entities/sesion-mesa.entity");
const historial_estado_pedido_entity_1 = require("./entities/historial-estado-pedido.entity");
const notificacion_entity_1 = require("./entities/notificacion.entity");
const refresh_token_entity_1 = require("./entities/refresh-token.entity");
const outbox_entity_1 = require("./entities/outbox.entity");
const mesas_module_1 = require("./mesas/mesas.module");
const auth_module_1 = require("./auth/auth.module");
const tenant_middleware_1 = require("./middleware/tenant.middleware");
let AppModule = class AppModule {
    configure(consumer) {
        // apply tenant middleware globally to attach `restauranteId` to requests
        // TenantMiddleware reads `x-restaurante-id` header, query or body
        // This is a simple approach; later replace with JWT-based tenant resolution.
        consumer.apply(tenant_middleware_1.TenantMiddleware).forRoutes('*');
        // JWT now handled via Passport guard in controllers (JwtMiddleware removed)
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRoot({
                type: 'mysql',
                host: process.env.DB_HOST || 'mysql',
                port: Number(process.env.DB_PORT) || 3306,
                username: process.env.DB_USER || 'ag_user',
                password: process.env.DB_PASSWORD || 'ag_password',
                database: process.env.DB_NAME || 'arisgourmet',
                entities: [
                    restaurante_entity_1.Restaurante,
                    mesa_entity_1.Mesa,
                    sesion_mesa_entity_1.MesaSesion,
                    producto_entity_1.Producto,
                    pedido_entity_1.Pedido,
                    item_pedido_entity_1.ItemPedido,
                    usuario_entity_1.Usuario,
                    role_entity_1.Role,
                    permiso_entity_1.Permiso,
                    evento_entity_1.Evento,
                    tiempo_entity_1.Tiempo,
                    historial_estado_pedido_entity_1.HistorialEstadoPedido,
                    notificacion_entity_1.Notificacion,
                    refresh_token_entity_1.RefreshToken,
                    outbox_entity_1.Outbox,
                ],
                // IMPORTANT: disable automatic schema sync in development to avoid
                // accidental data loss. Use explicit migrations for schema changes.
                synchronize: false,
                logging: false,
            }),
            mesas_module_1.MesasModule,
            auth_module_1.AuthModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map