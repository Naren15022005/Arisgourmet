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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const usuario_entity_1 = require("../entities/usuario.entity");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto_1 = require("crypto");
let AuthService = class AuthService {
    constructor(userRepo, dataSource) {
        this.userRepo = userRepo;
        this.dataSource = dataSource;
    }
    async register(email, nombre, password, role = 'cliente', restaurante_id) {
        const existing = await this.userRepo.findOne({ where: { email } });
        if (existing)
            throw new common_1.UnauthorizedException('Usuario ya existe');
        const hash = await bcrypt.hash(password, 10);
        // Canonical schema (DB-first): restaurante / role / usuario
        let restId = restaurante_id;
        if (!restId) {
            const generatedId = (0, crypto_1.randomUUID)();
            await this.dataSource.query('INSERT INTO restaurante (id, nombre) VALUES (?, ?)', [generatedId, `rest_${Date.now()}`]);
            const rows = await this.dataSource.query('SELECT id FROM restaurante WHERE id = ? LIMIT 1', [generatedId]);
            restId = rows[0].id;
        }
        const roleRows = await this.dataSource.query('SELECT id FROM role WHERE nombre = ? LIMIT 1', [role]);
        if (!roleRows || roleRows.length === 0) {
            await this.dataSource.query('INSERT INTO role (id, nombre) VALUES (?, ?)', [(0, crypto_1.randomUUID)(), role]);
        }
        await this.dataSource.query('INSERT INTO usuario (id, restaurante_id, email, nombre, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)', [(0, crypto_1.randomUUID)(), restId, email, nombre, hash, role]);
        const created = await this.userRepo.findOne({ where: { email } });
        return created;
    }
    async validateUser(email, password) {
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user)
            return null;
        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok)
            return null;
        return user;
    }
    generateToken(payload) {
        const secret = process.env.JWT_SECRET || 'dev-secret';
        const expiresIn = process.env.JWT_EXPIRES || '8h';
        return jwt.sign(payload, secret, { expiresIn });
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(usuario_entity_1.Usuario)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], AuthService);
//# sourceMappingURL=auth.service.js.map