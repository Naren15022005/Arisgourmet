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
exports.Usuario = void 0;
const typeorm_1 = require("typeorm");
let Usuario = class Usuario {
};
exports.Usuario = Usuario;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Usuario.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ unique: true, length: 200 }),
    __metadata("design:type", String)
], Usuario.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], Usuario.prototype, "nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], Usuario.prototype, "password_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'role', type: 'enum', enum: ['cliente', 'cocina', 'host', 'admin'], default: 'cliente' }),
    __metadata("design:type", String)
], Usuario.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Usuario.prototype, "restaurante_id", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Usuario.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Usuario.prototype, "updated_at", void 0);
exports.Usuario = Usuario = __decorate([
    (0, typeorm_1.Entity)({ name: 'usuario' })
], Usuario);
//# sourceMappingURL=usuario.entity.js.map