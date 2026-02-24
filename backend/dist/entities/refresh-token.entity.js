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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RefreshToken = void 0;
const typeorm_1 = require("typeorm");
const usuario_entity_1 = require("./usuario.entity");
let RefreshToken = class RefreshToken {
};
exports.RefreshToken = RefreshToken;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", Number)
], RefreshToken.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => usuario_entity_1.Usuario, { onDelete: 'CASCADE' }),
    (0, typeorm_1.JoinColumn)({ name: 'usuario_id' }),
    __metadata("design:type", usuario_entity_1.Usuario)
], RefreshToken.prototype, "usuario", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'token_hash', length: 255 }),
    __metadata("design:type", String)
], RefreshToken.prototype, "token_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], RefreshToken.prototype, "revoked", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'replaced_by_token_id', type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], RefreshToken.prototype, "replaced_by_token_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'expires_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], RefreshToken.prototype, "created_at", void 0);
exports.RefreshToken = RefreshToken = __decorate([
    (0, typeorm_1.Entity)({ name: 'refresh_tokens' })
], RefreshToken);
//# sourceMappingURL=refresh-token.entity.js.map