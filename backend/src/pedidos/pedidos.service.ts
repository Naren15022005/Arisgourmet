import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Pedido, PedidoEstado } from '../entities/pedido.entity';
import { ItemPedido } from '../entities/item-pedido.entity';
import { Outbox } from '../entities/outbox.entity';
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
    const where: any = {};
    if (restauranteId) where.restaurante_id = restauranteId;
    if (mesaId) where.mesa_id = mesaId;
    return this.pedidoRepo.find({ where, relations: ['items'], order: { created_at: 'DESC' } });
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
