import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { Usuario } from '../entities/usuario.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { RefreshService } from './refresh.service';

@Module({
  imports: [TypeOrmModule.forFeature([Usuario, RefreshToken]), PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [AuthService, JwtStrategy, RefreshService],
  controllers: [AuthController],
  exports: [AuthService, RefreshService],
})
export class AuthModule {}
