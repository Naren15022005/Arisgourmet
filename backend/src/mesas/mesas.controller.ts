import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MesasService } from './mesas.service';

@Controller('api/mesas')
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req: any) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.findAll(restauranteId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('restaurante')
  async getRestaurante(@Req() req: any) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.getRestaurante(restauranteId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('activate')
  async activate(@Body('codigo_qr') codigo_qr: string, @Req() req: any) {
    // `req.user` comes from JwtStrategy.validate
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.activate(codigo_qr, restauranteId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host','admin')
  @Post('release')
  async release(@Body('codigo_qr') codigo_qr: string, @Req() req: any) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.release(codigo_qr, restauranteId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host','admin')
  @Post('batch')
  async createBatch(
    @Body('cantidad') cantidad: number,
    @Body('prefijo') prefijo: string,
    @Req() req: any,
  ) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.createBatch(cantidad, restauranteId, prefijo);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host','admin')
  @Post()
  async create(
    @Req() req: any,
    @Body('codigo') codigo: string,
    @Body('capacidad') capacidad?: number,
  ) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.create(codigo, restauranteId, capacidad);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host','admin')
  @Patch(':id/capacidad')
  async updateCapacidad(
    @Param('id') id: string,
    @Body('capacidad') capacidad: number,
    @Req() req: any,
  ) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.updateCapacidad(id, capacidad, restauranteId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('host','admin')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const restauranteId = req.user?.restaurante_id || req.restauranteId;
    return this.mesasService.remove(id, restauranteId);
  }
}

