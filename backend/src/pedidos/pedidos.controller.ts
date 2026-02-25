import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PedidosService, CreatePedidoDto, UpdateEstadoDto } from './pedidos.service';
import { PedidoEstado } from '../entities/pedido.entity';

@Controller('api/pedidos')
export class PedidosController {
  constructor(private readonly pedidosService: PedidosService) {}

  /**
   * POST /api/pedidos
   * Crea un nuevo pedido. No requiere auth para permitir que el cliente
   * en la mesa envíe el pedido escaneando QR (request lleva restaurante_id en el body o header).
   */
  @Post()
  async create(@Body() body: CreatePedidoDto, @Req() req: any) {
    const restaurante_id = body.restaurante_id ?? req.restauranteId;
    return this.pedidosService.create({ ...body, restaurante_id });
  }

  /**
   * GET /api/pedidos
   * Lista pedidos del restaurante autenticado (o filtrado por mesa_id).
   */
  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req: any) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    const mesaId = req.query?.mesa_id as string | undefined;
    return this.pedidosService.findAll(restauranteId, mesaId);
  }

  /**
   * GET /api/pedidos/:id
   */
  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.pedidosService.findOne(id, restauranteId);
  }

  /**
   * PATCH /api/pedidos/:id/estado
   * Actualiza el estado del pedido (roles: host, admin, cocina).
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host', 'admin', 'cocina')
  @Patch(':id/estado')
  async updateEstado(
    @Param('id') id: string,
    @Body() body: UpdateEstadoDto,
    @Req() req: any,
  ) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.pedidosService.updateEstado(id, body, restauranteId);
  }

  /**
   * PATCH /api/pedidos/:id/cancelar
   * Cancela un pedido (roles: host, admin).
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host', 'admin')
  @Patch(':id/cancelar')
  async cancel(@Param('id') id: string, @Req() req: any) {
    const restauranteId = req.user?.restaurante_id ?? req.restauranteId;
    return this.pedidosService.cancel(id, restauranteId);
  }

  /**
   * GET /api/pedidos/estados
   * Devuelve los estados válidos para un pedido.
   */
  @Get('meta/estados')
  getEstados() {
    return Object.values(PedidoEstado);
  }
}
