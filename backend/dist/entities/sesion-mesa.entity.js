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
exports.MesaSesion = void 0;
const typeorm_1 = require("typeorm");
const mesa_entity_1 = require("./mesa.entity");
let MesaSesion = class MesaSesion {
};
exports.MesaSesion = MesaSesion;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], MesaSesion.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => mesa_entity_1.Mesa, { nullable: false }),
    __metadata("design:type", mesa_entity_1.Mesa)
], MesaSesion.prototype, "mesa", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], MesaSesion.prototype, "mesa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], MesaSesion.prototype, "cliente_nombre", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], MesaSesion.prototype, "inicio_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], MesaSesion.prototype, "fin_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], MesaSesion.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], MesaSesion.prototype, "updated_at", void 0);
exports.MesaSesion = MesaSesion = __decorate([
    (0, typeorm_1.Entity)({ name: 'mesa_sesion' })
], MesaSesion);
//# sourceMappingURL=sesion-mesa.entity.js.map