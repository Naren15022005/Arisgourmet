import { DataSource } from 'typeorm';
import { Mesa } from './entities/mesa.entity';
import { Producto } from './entities/producto.entity';
import { Pedido } from './entities/pedido.entity';
import { ItemPedido } from './entities/item-pedido.entity';
import { Usuario } from './entities/usuario.entity';
import { Evento } from './entities/evento.entity';
import { Tiempo } from './entities/tiempo.entity';
import { Restaurante } from './entities/restaurante.entity';
import { Role } from './entities/role.entity';
import { Permiso } from './entities/permiso.entity';
import { MesaSesion } from './entities/sesion-mesa.entity';
import { HistorialEstadoPedido } from './entities/historial-estado-pedido.entity';
import { Notificacion } from './entities/notificacion.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { Outbox } from './entities/outbox.entity';
import * as dotenv from 'dotenv';

dotenv.config({ path: process.env.ENV_PATH || '.env' });

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT) || 3306,
  username: process.env.DB_USER || 'ag_user',
  password: process.env.DB_PASSWORD || 'ag_password',
  database: process.env.DB_NAME || 'arisgourmet',
  entities: [
    Restaurante,
    Mesa,
    MesaSesion,
    Producto,
    Pedido,
    ItemPedido,
    Usuario,
    Role,
    Permiso,
    Evento,
    Tiempo,
    HistorialEstadoPedido,
    Notificacion,
    RefreshToken,
    Outbox,
  ],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
  // Allow multiple statements when running the big SQL DDL from migration
  extra: { multipleStatements: true },
  synchronize: false,
  logging: false,
});
