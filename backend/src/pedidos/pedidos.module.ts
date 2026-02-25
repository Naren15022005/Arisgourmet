import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pedido } from '../entities/pedido.entity';
import { ItemPedido } from '../entities/item-pedido.entity';
import { Outbox } from '../entities/outbox.entity';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Pedido, ItemPedido, Outbox])],
  providers: [PedidosService],
  controllers: [PedidosController],
  exports: [PedidosService],
})
export class PedidosModule {}
