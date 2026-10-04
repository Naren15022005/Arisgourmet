import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Pedido, PedidoEstado } from '../entities/pedido.entity';
import { ItemPedido } from '../entities/item-pedido.entity';
import { Outbox } from '../entities/outbox.entity';
import { Mesa, MesaEstado } from '../entities/mesa.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { randomUUID } from 'crypto';

export interface CreateItemDto {
  producto_id: string;
  cantidad: number;
  precio_unitario: number;
}

export interface CreatePedidoDto {
  mesa_id: string;
  restaurante_id?: string;
  items: CreateItemDto[];
}

export interface UpdateEstadoDto {
  estado: PedidoEstado;
}

@Injectable()
export class PedidosService {
  constructor(
    @InjectRepository(Pedido)
    private readonly pedidoRepo: Repository<Pedido>,
    @InjectRepository(ItemPedido)
    private readonly itemRepo: Repository<ItemPedido>,
    @InjectRepository(Outbox)
    private readonly outboxRepo: Repository<Outbox>,
    private readonly dataSource: DataSource,
    @Optional()
    private readonly notificationsService?: NotificationsService,
  ) {}

  async create(dto: CreatePedidoDto): Promise<Pedido> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('El pedido debe tener al menos un ítem');
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const pedido = manager.create(Pedido, {
        id: randomUUID(),
        mesa_id: dto.mesa_id,
        restaurante_id: dto.restaurante_id ?? null,
        estado: PedidoEstado.PENDIENTE,
      });

      // Ocupar mesa automáticamente al recibir el pedido del cliente
      try {
        const mesaRepo = manager.getRepository(Mesa);
        const mesa = await mesaRepo.findOne({
          where: [
            { id: dto.mesa_id },
            { codigo: dto.mesa_id },
            { codigo: `MESA-${dto.mesa_id}` },
          ],
        });
        if (mesa) {
          // Asegurar que el pedido use el código de mesa visible canónico
          pedido.mesa_id = mesa.codigo;
          if (mesa.estado !== MesaEstado.OCUPADA) {
            mesa.estado = MesaEstado.OCUPADA;
            mesa.ocupado = 1;
            mesa.ocupado_desde = new Date();
            await mesaRepo.save(mesa);
          }
        }
      } catch (err) {
        console.warn('[pedidos] Could not auto-occupy mesa:', err);
      }

      await manager.save(pedido);

      const items = dto.items.map((i) =>
        manager.create(ItemPedido, {
          id: randomUUID(),
          pedidoId: pedido.id,
          producto_id: i.producto_id,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
          restaurante_id: dto.restaurante_id ?? null,
        }),
      );
      await manager.save(items);
      pedido.items = items;
      return pedido;
    });

    // Write outbox event best-effort (outside main tx to avoid failing pedido creation)
    try {
      const event = this.outboxRepo.create({
        aggregate_type: 'pedido',
        aggregate_id: result.id,
        event_type: 'CREADO',
        payload: {
          id: result.id,
          mesa_id: result.mesa_id,
          restaurante_id: result.restaurante_id,
          estado: result.estado,
          items: dto.items,
        },
        processed: false,
        attempts: 0,
        dlq: false,
      });
      await this.outboxRepo.save(event);
    } catch (outboxErr) {
      console.warn('[pedidos] Outbox write failed (non-fatal):', (outboxErr as Error).message);
    }

    // Notificaciones en tiempo real a cocina y al salón/plano de mesas
    try {
      if (this.notificationsService) {
        if (result.restaurante_id) {
          this.notificationsService.emitToRestaurante(result.restaurante_id, 'pedido:CREADO', result);
          this.notificationsService.emitToRestaurante(result.restaurante_id, 'mesa:ACTIVADA', {
            id: result.mesa_id,
            codigo: result.mesa_id,
            estado: MesaEstado.OCUPADA,
          });
        } else {
          this.notificationsService.broadcast('pedido:CREADO', result);
          this.notificationsService.broadcast('mesa:ACTIVADA', {
            id: result.mesa_id,
            codigo: result.mesa_id,
            estado: MesaEstado.OCUPADA,
          });
        }
      }
    } catch (notifErr) {
      console.warn('[pedidos] Notification failed (non-fatal):', notifErr);
    }

    return result;
  }

  async updateEstado(id: string, dto: UpdateEstadoDto, restauranteId?: string): Promise<Pedido> {
    const where: any = { id };
    if (restauranteId) where.restaurante_id = restauranteId;

    const pedido = await this.pedidoRepo.findOne({ where, relations: ['items'] });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    const previousEstado = pedido.estado;
    pedido.estado = dto.estado;
    await this.pedidoRepo.save(pedido);

    // Write outbox event best-effort
    try {
      const event = this.outboxRepo.create({
        aggregate_type: 'pedido',
        aggregate_id: pedido.id,
        event_type: 'ESTADO_ACTUALIZADO',
        payload: {
          id: pedido.id,
          mesa_id: pedido.mesa_id,
          restaurante_id: pedido.restaurante_id,
          estado_anterior: previousEstado,
          estado: dto.estado,
        },
        processed: false,
        attempts: 0,
        dlq: false,
      });
      await this.outboxRepo.save(event);
    } catch (outboxErr) {
      console.warn('[pedidos] Outbox write on updateEstado failed (non-fatal):', (outboxErr as Error).message);
    }

    return pedido;
  }

  async findAll(restauranteId?: string, mesaId?: string): Promise<Pedido[]> {
    const qb = this.pedidoRepo
      .createQueryBuilder('pedido')
      .leftJoinAndSelect('pedido.items', 'items')
      .orderBy('pedido.created_at', 'DESC');

    if (restauranteId) {
      qb.andWhere('pedido.restaurante_id = :restauranteId', { restauranteId });
    }

    if (mesaId) {
      const identifiers = [mesaId];
      try {
        const mesa = await this.dataSource.getRepository(Mesa).findOne({
          where: [
            { id: mesaId },
            { codigo: mesaId },
            { codigo: `MESA-${mesaId}` },
          ],
        });
        if (mesa) {
          identifiers.push(mesa.id, mesa.codigo);
        }
      } catch {}

      qb.andWhere('pedido.mesa_id IN (:...identifiers)', {
        identifiers: Array.from(new Set(identifiers)),
      });
    }

    return qb.getMany();
  }

  async findOne(id: string, restauranteId?: string): Promise<Pedido> {
    const where: any = { id };
    if (restauranteId) where.restaurante_id = restauranteId;
    const pedido = await this.pedidoRepo.findOne({ where, relations: ['items'] });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');
    return pedido;
  }

  async cancel(id: string, restauranteId?: string): Promise<Pedido> {
    return this.updateEstado(id, { estado: PedidoEstado.CANCELADO }, restauranteId);
  }
}

