import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Usuario } from '../entities/usuario.entity';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

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

    // ensure restaurante exists (or create one) and resolve role_id, then insert into underlying tables
    let restId = restaurante_id;
    if (!restId) {
      await this.dataSource.query('INSERT INTO restaurantes (nombre) VALUES (?)', [`rest_${Date.now()}`]);
      const rows = await this.dataSource.query('SELECT id FROM restaurantes ORDER BY id DESC LIMIT 1');
      restId = rows[0].id;
    }

    // find or create role row to satisfy FK
    const roleRows = await this.dataSource.query('SELECT id FROM roles WHERE nombre = ? LIMIT 1', [role]);
    let roleId: number | null = null;
    if (roleRows && roleRows.length > 0) {
      roleId = roleRows[0].id;
    } else {
      await this.dataSource.query('INSERT INTO roles (nombre) VALUES (?)', [role]);
      const r2 = await this.dataSource.query('SELECT id FROM roles WHERE nombre = ? ORDER BY id DESC LIMIT 1', [role]);
      roleId = r2[0].id;
    }

    await this.dataSource.query(
      'INSERT INTO usuarios (restaurante_id, email, nombre, password_hash, role_id) VALUES (?, ?, ?, ?, ?)',
      [restId, email, nombre, hash, roleId],
    );

    // return the user via repository (view)
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
