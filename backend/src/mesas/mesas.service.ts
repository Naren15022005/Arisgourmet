import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa } from '../entities/mesa.entity';
import { MesaEstado } from '../entities/mesa.entity';

@Injectable()
export class MesasService {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepo: Repository<Mesa>,
  ) {}

  async findAll(restauranteId?: string) {
    const where = restauranteId ? { restaurante_id: restauranteId } : {};
    return this.mesaRepo.find({ where });
  }

  async activate(codigo_qr: string, restauranteId?: string) {
    const where: any = { codigo_qr };
    if (restauranteId) where.restaurante_id = restauranteId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    mesa.estado = MesaEstado.ACTIVA;
    mesa.ocupado = true;
    mesa.ocupado_desde = new Date();
    mesa.ultima_actividad_at = new Date();

    return this.mesaRepo.save(mesa);
  }

  async release(codigo_qr: string, restauranteId?: string) {
    const where: any = { codigo_qr };
    if (restauranteId) where.restaurante_id = restauranteId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new Error('Mesa no encontrada');

    mesa.estado = MesaEstado.LIBRE;
    mesa.ocupado = false;
    mesa.ocupado_desde = null;
    mesa.ultima_actividad_at = new Date();

    return this.mesaRepo.save(mesa);
  }
}
