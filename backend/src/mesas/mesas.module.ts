import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mesa } from '../entities/mesa.entity';
import { MesasService } from './mesas.service';
import { MesasController } from './mesas.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mesa]),
    NotificationsModule,
  ],
  providers: [MesasService],
  controllers: [MesasController],
})
export class MesasModule {}
