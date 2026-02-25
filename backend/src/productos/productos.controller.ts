import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ProductosService, CreateProductoDto, UpdateProductoDto } from './productos.service';

@Controller('api/productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  /**
   * GET /api/productos
   * Lista todos los productos disponibles para el restaurante.
   * Abierto al público (sin auth) para carta del cliente.
   */
  @Get()
  async findAll(@Req() req: any) {
    const restauranteId = req.restauranteId as string | undefined;
    return this.productosService.findAvailable(restauranteId);
  }

  /**
   * GET /api/productos/admin
   * Lista todos los productos (incluidos no disponibles) — requiere auth.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host', 'admin')
  @Get('admin')
  async findAllAdmin(@Req() req: any) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.productosService.findAll(restauranteId);
  }

  /**
   * GET /api/productos/:id
   */
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.productosService.findOne(id, restauranteId);
  }

  /**
   * POST /api/productos
   * Crea un producto (requiere auth con rol host o admin).
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host', 'admin')
  @Post()
  async create(@Body() body: CreateProductoDto, @Req() req: any) {
    const restaurante_id = body.restaurante_id ?? req.user?.restaurante_id ?? req.restauranteId;
    return this.productosService.create({ ...body, restaurante_id });
  }

  /**
   * PATCH /api/productos/:id
   * Actualiza un producto.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateProductoDto,
    @Req() req: any,
  ) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.productosService.update(id, body, restauranteId);
  }

  /**
   * PATCH /api/productos/:id/toggle
   * Alterna disponibilidad del producto.
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id/toggle')
  async toggle(@Param('id') id: string, @Req() req: any) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.productosService.toggleDisponible(id, restauranteId);
  }
}
