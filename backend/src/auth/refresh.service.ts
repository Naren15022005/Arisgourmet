import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Usuario } from '../entities/usuario.entity';
import { AuthService } from './auth.service';
import { randomBytes, createHash } from 'crypto';

function hashToken(raw: string) {
  return createHash('sha256').update(raw).digest('hex');
}

@Injectable()
export class RefreshService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshRepo: Repository<RefreshToken>,
    @InjectRepository(Usuario)
    private readonly userRepo: Repository<Usuario>,
    private readonly authService: AuthService,
  ) {}

  private generateRawToken() {
    return randomBytes(48).toString('base64url');
  }

  private getExpiryDate() {
    const days = Number(process.env.REFRESH_TOKEN_DAYS || '30');
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  }

  async createForUser(user: Usuario) {
    const raw = this.generateRawToken();
    const token_hash = hashToken(raw);
    const entity = this.refreshRepo.create({ token_hash, usuario: user, expires_at: this.getExpiryDate() });
    await this.refreshRepo.save(entity);
    return raw;
  }

  async revoke(raw: string) {
    const token_hash = hashToken(raw);
    const t = await this.refreshRepo.findOne({ where: { token_hash } });
    if (!t) return false;
    t.revoked = true;
    await this.refreshRepo.save(t);
    return true;
  }

  async rotate(raw: string) {
    const token_hash = hashToken(raw);
    const found = await this.refreshRepo.findOne({ where: { token_hash }, relations: ['usuario'] });
    if (!found || found.revoked) throw new UnauthorizedException('Invalid refresh token');
    if (found.expires_at && found.expires_at < new Date()) throw new UnauthorizedException('Refresh token expired');

    // perform rotation in a transaction
    return await this.refreshRepo.manager.transaction(async (manager) => {
      const user = found.usuario as Usuario;
      const rawNew = this.generateRawToken();
      const newHash = hashToken(rawNew);
      const newToken = manager.create(RefreshToken, { token_hash: newHash, usuario: user, expires_at: this.getExpiryDate() });
      const saved = await manager.save(newToken);

      // mark old token revoked and link
      found.revoked = true;
      found.replaced_by_token_id = saved.id as any;
      await manager.save(found);

      const access = this.authService.generateToken({ sub: user.id, email: user.email, role: user.role, restaurante_id: user.restaurante_id });
      return { access_token: access, refresh_token: rawNew };
    });
  }
}
