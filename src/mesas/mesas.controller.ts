import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { MesasService } from './mesas.service';

@Controller('api/mesas')
export class MesasController {
  constructor(private readonly mesasService: MesasService) {}

  @Get()
  async findAll(@Req() req: any) {
    const restauranteId = req.restauranteId;
    return this.mesasService.findAll(restauranteId);
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
}
