import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from '../entities/producto.entity';

export interface CreateProductoDto {
  nombre: string;
  descripcion?: string;
  precio: number;
  categoria?: string;
  detalles_json?: string;
  disponible?: boolean;
  tiempo_base_minutos?: number;
  restaurante_id?: string;
}

export interface UpdateProductoDto {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  categoria?: string;
  detalles_json?: string;
  disponible?: boolean;
  tiempo_base_minutos?: number;
}

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepo: Repository<Producto>,
  ) {}

  async findAll(restauranteId?: string, categoria?: string): Promise<Producto[]> {
    const where: any = {};
    if (restauranteId) where.restaurante_id = restauranteId;
    if (categoria) where.categoria = categoria;
    return this.productoRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findAvailable(restauranteId?: string, categoria?: string): Promise<Producto[]> {
    const where: any = { disponible: true };
    if (restauranteId) where.restaurante_id = restauranteId;
    if (categoria) where.categoria = categoria;
    return this.productoRepo.find({ where, order: { created_at: 'DESC' } });
  }

  async findOne(id: string, restauranteId?: string): Promise<Producto> {
    const where: any = { id };
    if (restauranteId) where.restaurante_id = restauranteId;
    const producto = await this.productoRepo.findOne({ where });
    if (!producto) throw new NotFoundException('Producto no encontrado');
    return producto;
  }

  async create(dto: CreateProductoDto): Promise<Producto> {
    const producto = this.productoRepo.create({
      ...dto,
      categoria: dto.categoria || 'plato_fuerte',
      disponible: dto.disponible !== undefined ? dto.disponible : true,
      tiempo_base_minutos: dto.tiempo_base_minutos ?? 0,
    });
    return this.productoRepo.save(producto);
  }

  async update(id: string, dto: UpdateProductoDto, restauranteId?: string): Promise<Producto> {
    const producto = await this.findOne(id, restauranteId);
    Object.assign(producto, dto);
    return this.productoRepo.save(producto);
  }

  async delete(id: string, restauranteId?: string): Promise<{ success: boolean; id: string }> {
    const producto = await this.findOne(id, restauranteId);
    await this.productoRepo.remove(producto);
    return { success: true, id };
  }

  async toggleDisponible(id: string, restauranteId?: string): Promise<Producto> {
    const producto = await this.findOne(id, restauranteId);
    producto.disponible = !producto.disponible;
    return this.productoRepo.save(producto);
  }
}
