import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa } from '../entities/mesa.entity';
import { MesaEstado } from '../entities/mesa.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MesasService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepo: Repository<Mesa>,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findAll(restauranteId?: string | number) {
    const restId = restauranteId ? String(restauranteId) : undefined;
    const where = restId ? { restaurante_id: restId } : {};
    return this.mesaRepo.find({ where, order: { created_at: 'ASC' } });
  }

  async activate(codigo: string, restauranteId?: string | number) {
    const where: any = { codigo };
    const restId = restauranteId ? String(restauranteId) : undefined;
    if (restId) where.restaurante_id = restId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    mesa.estado = MesaEstado.OCUPADA;
    const saved = await this.mesaRepo.save(mesa);

    if (saved.restaurante_id) {
      this.notificationsService.emitToRestaurante(
        String(saved.restaurante_id),
        'mesa:ACTIVADA',
        { id: saved.id, codigo: saved.codigo, estado: saved.estado, restaurante_id: saved.restaurante_id },
      );
    }

    return saved;
  }

  async release(codigo: string, restauranteId?: string | number) {
    const where: any = { codigo };
    const restId = restauranteId ? String(restauranteId) : undefined;
    if (restId) where.restaurante_id = restId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    mesa.estado = MesaEstado.LIBRE;
    const saved = await this.mesaRepo.save(mesa);

    if (saved.restaurante_id) {
      this.notificationsService.emitToRestaurante(
        String(saved.restaurante_id),
        'mesa:LIBERADA',
        { id: saved.id, codigo: saved.codigo, estado: saved.estado, restaurante_id: saved.restaurante_id },
      );
    }

    return saved;
  }

  async create(codigo: string, restauranteId?: string | number, capacidad = 4) {
    const mesa = this.mesaRepo.create({
      codigo,
      restaurante_id: restauranteId ? String(restauranteId) : undefined,
      estado: MesaEstado.LIBRE,
      capacidad: Math.min(8, Math.max(2, Number(capacidad) || 4)),
    });
    try {
      const saved = await this.mesaRepo.save(mesa);

      if (saved.restaurante_id) {
        this.notificationsService.emitToRestaurante(
          String(saved.restaurante_id),
          'mesa:CREADA',
          saved,
        );
      }

      return saved;
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY' || String(err?.message).includes('Duplicate entry')) {
        throw new BadRequestException(`Ya existe una mesa con el código ${codigo} en tu salón`);
      }
      throw err;
    }
  }

  async updateCapacidad(id: string, capacidad: number, restauranteId?: string | number) {
    const where: any = { id };
    const restId = restauranteId ? String(restauranteId) : undefined;
    if (restId) where.restaurante_id = restId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    mesa.capacidad = Math.min(8, Math.max(2, Number(capacidad) || 4));
    const saved = await this.mesaRepo.save(mesa);

    if (saved.restaurante_id) {
      this.notificationsService.emitToRestaurante(
        String(saved.restaurante_id),
        'mesa:CAPACIDAD_ACTUALIZADA',
        { id: saved.id, capacidad: saved.capacidad, restaurante_id: saved.restaurante_id },
      );
    }

    return saved;
  }

  /**
   * Crea un lote de mesas correlativas (ej: 7 mesas -> MESA-1, MESA-2 ... MESA-7)
   */
  async createBatch(cantidad: number, restauranteId?: string | number, prefijo = 'MESA-') {
    const qty = Number(cantidad);
    if (isNaN(qty) || qty <= 0) {
      throw new BadRequestException('La cantidad debe ser un número entero mayor a 0');
    }
    if (qty > 100) {
      throw new BadRequestException('El límite máximo por lote es de 100 mesas');
    }

    const restId = restauranteId ? String(restauranteId) : undefined;
    const cleanPrefix = (prefijo || 'MESA-').trim().toUpperCase();

    // Obtener mesas existentes para respetar orden correlativo y unicidad
    const existing = await this.findAll(restId);
    const existingCodes = new Set(existing.map((m) => m.codigo.toUpperCase()));

    // Detectar el correlativo más alto actual con este prefijo
    let maxIndex = 0;
    const escapedPrefix = cleanPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i');

    for (const m of existing) {
      const match = m.codigo.match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxIndex) {
          maxIndex = num;
        }
      }
    }

    const nuevasMesas: Mesa[] = [];
    let nextNum = maxIndex + 1;

    while (nuevasMesas.length < qty) {
      const codigo = `${cleanPrefix}${nextNum}`;
      if (!existingCodes.has(codigo)) {
        nuevasMesas.push(
          this.mesaRepo.create({
            codigo,
            restaurante_id: restId,
            estado: MesaEstado.LIBRE,
          }),
        );
        existingCodes.add(codigo);
      }
      nextNum++;
    }

    try {
      const saved = await this.mesaRepo.save(nuevasMesas);
      if (restId) {
        for (const m of saved) {
          this.notificationsService.emitToRestaurante(String(restId), 'mesa:CREADA', m);
        }
      }
      return saved;
    } catch (err: any) {
      if (err?.code === 'ER_DUP_ENTRY' || String(err?.message).includes('Duplicate entry')) {
        throw new BadRequestException('Una o más mesas a generar ya existen en tu salón');
      }
      throw err;
    }
  }

  async remove(id: string, restauranteId?: string | number) {
    const where: any = { id };
    const restId = restauranteId ? String(restauranteId) : undefined;
    if (restId) where.restaurante_id = restId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    await this.mesaRepo.remove(mesa);

    if (mesa.restaurante_id) {
      this.notificationsService.emitToRestaurante(
        String(mesa.restaurante_id),
        'mesa:ELIMINADA',
        { id, restaurante_id: mesa.restaurante_id },
      );
    }

    return { success: true, id };
  }

  async getRestaurante(restauranteId?: string | number) {
    if (!restauranteId) return null;
    const rows = await this.mesaRepo.manager.query(
      'SELECT id, nombre, slug FROM restaurante WHERE id = ? OR slug = ? LIMIT 1',
      [String(restauranteId), String(restauranteId)],
    );
    return rows && rows.length > 0 ? rows[0] : null;
  }
}
