import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly userRepo: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) {}

  async register(email: string, nombre: string, password: string, role: string = 'cliente', restaurante_id?: string) {
    const existing = await this.userRepo.findOne({ where: { email } });
    if (existing) throw new UnauthorizedException('Usuario ya existe');

    const hash = await bcrypt.hash(password, 10);

    // Canonical schema (DB-first): restaurante / role / usuario
    let restId = restaurante_id;
    if (!restId) {
      const generatedId = randomUUID();
      await this.dataSource.query('INSERT INTO restaurante (id, nombre) VALUES (?, ?)', [generatedId, `rest_${Date.now()}`]);
      const rows = await this.dataSource.query('SELECT id FROM restaurante WHERE id = ? LIMIT 1', [generatedId]);
      restId = rows[0].id;
    }

    const roleRows = await this.dataSource.query('SELECT id FROM role WHERE nombre = ? LIMIT 1', [role]);
    if (!roleRows || roleRows.length === 0) {
      await this.dataSource.query('INSERT INTO role (id, nombre) VALUES (?, ?)', [randomUUID(), role]);
    }

    await this.dataSource.query(
      'INSERT INTO usuario (id, restaurante_id, email, nombre, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)',
      [randomUUID(), restId, email, nombre, hash, role],
    );

    const created = await this.userRepo.findOne({ where: { email } });
    return created;
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
