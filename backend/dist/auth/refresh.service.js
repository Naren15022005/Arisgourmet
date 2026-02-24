"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const refresh_token_entity_1 = require("../entities/refresh-token.entity");
const usuario_entity_1 = require("../entities/usuario.entity");
const auth_service_1 = require("./auth.service");
const crypto_1 = require("crypto");
function hashToken(raw) {
    return (0, crypto_1.createHash)('sha256').update(raw).digest('hex');
}
let RefreshService = class RefreshService {
    constructor(refreshRepo, userRepo, authService) {
        this.refreshRepo = refreshRepo;
        this.userRepo = userRepo;
        this.authService = authService;
        this.inMemory = new Map();
        this.inMemoryNextId = 1;
    }
    isFallbackEnabled() {
        if (process.env.NODE_ENV === 'production')
            return false;
        const raw = process.env.REFRESH_INMEMORY_FALLBACK;
        if (!raw)
            return true;
        return raw === '1' || raw.toLowerCase() === 'true';
    }
    shouldFallback(err) {
        const msg = String(err && err.message ? err.message : err);
        return msg.includes('doesn\'t exist') || msg.includes('ER_NO_SUCH_TABLE');
    }
    generateRawToken() {
        return (0, crypto_1.randomBytes)(48).toString('base64url');
    }
    getExpiryDate() {
        const days = Number(process.env.REFRESH_TOKEN_DAYS || '30');
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d;
    }
    async createForUser(user) {
        const raw = this.generateRawToken();
        const token_hash = hashToken(raw);
        const entity = this.refreshRepo.create({ token_hash, usuario: user, expires_at: this.getExpiryDate() });
        try {
            await this.refreshRepo.save(entity);
        }
        catch (err) {
            if (!this.isFallbackEnabled() || !this.shouldFallback(err))
                throw err;
            const id = this.inMemoryNextId++;
            this.inMemory.set(token_hash, { id, token_hash, usuario: user, expires_at: this.getExpiryDate(), revoked: false });
        }
        return raw;
    }
    async revoke(raw) {
        const token_hash = hashToken(raw);
        try {
            const t = await this.refreshRepo.findOne({ where: { token_hash } });
            if (!t)
                return false;
            t.revoked = true;
            await this.refreshRepo.save(t);
            return true;
        }
        catch (err) {
            if (!this.isFallbackEnabled() || !this.shouldFallback(err))
                throw err;
            const v = this.inMemory.get(token_hash);
            if (!v)
                return false;
            v.revoked = true;
            this.inMemory.set(token_hash, v);
            return true;
        }
    }
    async rotate(raw) {
        const token_hash = hashToken(raw);
        try {
            const found = await this.refreshRepo.findOne({ where: { token_hash }, relations: ['usuario'] });
            if (!found || found.revoked)
                throw new common_1.UnauthorizedException('Invalid refresh token');
            if (found.expires_at && found.expires_at < new Date())
                throw new common_1.UnauthorizedException('Refresh token expired');
            // perform rotation in a transaction
            return await this.refreshRepo.manager.transaction(async (manager) => {
                const user = found.usuario;
                const rawNew = this.generateRawToken();
                const newHash = hashToken(rawNew);
                const newToken = manager.create(refresh_token_entity_1.RefreshToken, { token_hash: newHash, usuario: user, expires_at: this.getExpiryDate() });
                const saved = await manager.save(newToken);
                found.revoked = true;
                found.replaced_by_token_id = saved.id;
                await manager.save(found);
                const access = this.authService.generateToken({ sub: user.id, email: user.email, role: user.role, restaurante_id: user.restaurante_id });
                return { access_token: access, refresh_token: rawNew };
            });
        }
        catch (err) {
            if (!this.isFallbackEnabled() || !this.shouldFallback(err))
                throw err;
            const v = this.inMemory.get(token_hash);
            if (!v || v.revoked)
                throw new common_1.UnauthorizedException('Invalid refresh token');
            if (v.expires_at && v.expires_at < new Date())
                throw new common_1.UnauthorizedException('Refresh token expired');
            const user = v.usuario;
            const rawNew = this.generateRawToken();
            const newHash = hashToken(rawNew);
            const id = this.inMemoryNextId++;
            this.inMemory.set(newHash, { id, token_hash: newHash, usuario: user, expires_at: this.getExpiryDate(), revoked: false });
            v.revoked = true;
            v.replaced_by_token_id = id;
            this.inMemory.set(token_hash, v);
            const access = this.authService.generateToken({ sub: user.id, email: user.email, role: user.role, restaurante_id: user.restaurante_id });
            return { access_token: access, refresh_token: rawNew };
        }
    }
};
exports.RefreshService = RefreshService;
exports.RefreshService = RefreshService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(refresh_token_entity_1.RefreshToken)),
    __param(1, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        auth_service_1.AuthService])
], RefreshService);
//# sourceMappingURL=refresh.service.js.map