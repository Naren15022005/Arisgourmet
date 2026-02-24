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
exports.Tiempo = void 0;
const typeorm_1 = require("typeorm");
let Tiempo = class Tiempo {
};
exports.Tiempo = Tiempo;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Tiempo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Tiempo.prototype, "producto_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int' }),
    __metadata("design:type", Number)
], Tiempo.prototype, "tiempo_base_minutos", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', nullable: true }),
    __metadata("design:type", Number)
], Tiempo.prototype, "tiempo_estimado_actual_minutos", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Tiempo.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Tiempo.prototype, "restaurante_id", void 0);
exports.Tiempo = Tiempo = __decorate([
    (0, typeorm_1.Entity)({ name: 'tiempo' })
], Tiempo);
//# sourceMappingURL=tiempo.entity.js.map