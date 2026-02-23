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

    // ensure restaurante exists (or create one) and resolve role_id, then insert into underlying tables
    let restId = restaurante_id;
    if (!restId) {
      await this.dataSource.query('INSERT INTO restaurantes (nombre) VALUES (?)', [`rest_${Date.now()}`]);
      const rows = await this.dataSource.query('SELECT id FROM restaurantes ORDER BY id DESC LIMIT 1');
      restId = rows[0].id;
    }

    // find or create role row to satisfy FK if present; otherwise rely on enum role column
    const roleTableCheck = await this.dataSource.query("SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='roles'");
    const roleTable = roleTableCheck && roleTableCheck[0] && roleTableCheck[0].c > 0 ? 'roles' : (await this.dataSource.query("SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='role'")) && 'role';

    let roleId: number | null = null;
    if (roleTable) {
      const roleRows = await this.dataSource.query(`SELECT id FROM ${roleTable} WHERE nombre = ? LIMIT 1`, [role]);
      if (roleRows && roleRows.length > 0) {
        roleId = roleRows[0].id;
      } else {
        await this.dataSource.query(`INSERT INTO ${roleTable} (nombre) VALUES (?)`, [role]);
        const r2 = await this.dataSource.query(`SELECT id FROM ${roleTable} WHERE nombre = ? ORDER BY id DESC LIMIT 1`, [role]);
        roleId = r2[0].id;
      }
    }

    // insert user depending on whether usuario table expects role_id or role enum
    const usuarioTableCheck = await this.dataSource.query("SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='usuarios'");
    const usuarioTable = usuarioTableCheck && usuarioTableCheck[0] && usuarioTableCheck[0].c > 0 ? 'usuarios' : 'usuario';
    const roleIdColCheck = await this.dataSource.query("SELECT COUNT(*) as c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='role_id'", [usuarioTable]);
    // detect if `id` column requires explicit UUID insertion (varchar PK)
    const idCol = await this.dataSource.query("SELECT COLUMN_TYPE, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME='id'", [usuarioTable]);
    const needsId = idCol && idCol[0] && typeof idCol[0].COLUMN_TYPE === 'string' && idCol[0].COLUMN_TYPE.startsWith('varchar');
    const newId = needsId ? randomUUID() : undefined;

    if (roleIdColCheck && roleIdColCheck[0] && roleIdColCheck[0].c > 0) {
      if (needsId) {
        await this.dataSource.query(
          `INSERT INTO ${usuarioTable} (id, restaurante_id, email, nombre, password_hash, role_id) VALUES (?, ?, ?, ?, ?, ?)`,
          [newId, restId, email, nombre, hash, roleId],
        );
      } else {
        await this.dataSource.query(
          `INSERT INTO ${usuarioTable} (restaurante_id, email, nombre, password_hash, role_id) VALUES (?, ?, ?, ?, ?)`,
          [restId, email, nombre, hash, roleId],
        );
      }
    } else {
      if (needsId) {
        await this.dataSource.query(
          `INSERT INTO ${usuarioTable} (id, restaurante_id, email, nombre, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)`,
          [newId, restId, email, nombre, hash, role],
        );
      } else {
        await this.dataSource.query(
          `INSERT INTO ${usuarioTable} (restaurante_id, email, nombre, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
          [restId, email, nombre, hash, role],
        );
      }
    }

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
