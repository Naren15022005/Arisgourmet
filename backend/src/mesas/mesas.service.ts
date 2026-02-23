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

  async findAll(restauranteId?: string | number) {
    const restId = restauranteId ? Number(restauranteId) : undefined;
    const where = restId ? { restaurante_id: restId } : {};
    return this.mesaRepo.find({ where });
  }

  async activate(codigo: string, restauranteId?: string | number) {
    const where: any = { codigo };
    const restId = restauranteId ? Number(restauranteId) : undefined;
    if (restId) where.restaurante_id = restId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new NotFoundException('Mesa no encontrada');

    mesa.estado = MesaEstado.OCUPADA;

    return this.mesaRepo.save(mesa);
  }

  async release(codigo: string, restauranteId?: string | number) {
    const where: any = { codigo };
    const restId = restauranteId ? Number(restauranteId) : undefined;
    if (restId) where.restaurante_id = restId;

    const mesa = await this.mesaRepo.findOneBy(where);
    if (!mesa) throw new Error('Mesa no encontrada');

    mesa.estado = MesaEstado.LIBRE;

    return this.mesaRepo.save(mesa);
  }
}
