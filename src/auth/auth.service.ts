import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepo: Repository<Usuario>,
  ) {}

  async register(email: string, nombre: string, password: string, role: string = 'cliente', restaurante_id?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Usuario ya existe');

    const hash = await bcrypt.hash(password, 10);
    const user = this.userRepo.create({ email, nombre, password_hash: hash, role: role as any, restaurante_id });
    return this.userRepo.save(user);
  }

  async validateUser(email: string, password: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return null;
    return user;
  }

  generateToken(payload: object) {
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const expiresIn = process.env.JWT_EXPIRES || '8h';
    return jwt.sign(payload, secret, { expiresIn });
  }
}
