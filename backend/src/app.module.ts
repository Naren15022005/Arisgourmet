import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { MesasModule } from './mesas/mesas.module';
import { AuthModule } from './auth/auth.module';
import { TenantMiddleware } from './middleware/tenant.middleware';

@Module({
  imports: [
    TypeOrmModule.forRoot({
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
      // IMPORTANT: disable automatic schema sync in development to avoid
      // accidental data loss. Use explicit migrations for schema changes.
      synchronize: false,
      logging: false,
    }),
    MesasModule,
    AuthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // apply tenant middleware globally to attach `restauranteId` to requests
    // TenantMiddleware reads `x-restaurante-id` header, query or body
    // This is a simple approach; later replace with JWT-based tenant resolution.
    consumer.apply(TenantMiddleware).forRoutes('*');

    // JWT now handled via Passport guard in controllers (JwtMiddleware removed)
  }
}
