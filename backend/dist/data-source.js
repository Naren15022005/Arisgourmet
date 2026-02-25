"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const typeorm_1 = require("typeorm");
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
const dotenv = require("dotenv");
dotenv.config({ path: process.env.ENV_PATH || '.env' });
exports.AppDataSource = new typeorm_1.DataSource({
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
    migrations: [__dirname + '/migrations/*.{ts,js}'],
    // Allow multiple statements when running the big SQL DDL from migration
    extra: { multipleStatements: true },
    synchronize: false,
    logging: false,
});
//# sourceMappingURL=data-source.js.map