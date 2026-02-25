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
exports.Mesa = exports.MesaEstado = void 0;
const typeorm_1 = require("typeorm");
var MesaEstado;
(function (MesaEstado) {
    MesaEstado["LIBRE"] = "libre";
    MesaEstado["OCUPADA"] = "ocupada";
    MesaEstado["ACTIVA"] = "activa";
    MesaEstado["INACTIVA"] = "inactiva";
    MesaEstado["LIBERADA"] = "liberada";
})(MesaEstado || (exports.MesaEstado = MesaEstado = {}));
let Mesa = class Mesa {
};
exports.Mesa = Mesa;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Mesa.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Mesa.prototype, "restaurante_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'codigo_qr', unique: true }),
    __metadata("design:type", String)
], Mesa.prototype, "codigo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: MesaEstado, default: MesaEstado.LIBRE }),
    __metadata("design:type", String)
], Mesa.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ultima_actividad_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Mesa.prototype, "ultima_actividad_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ocupado', type: 'tinyint', default: 0 }),
    __metadata("design:type", Number)
], Mesa.prototype, "ocupado", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'ocupado_desde', type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], Mesa.prototype, "ocupado_desde", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Mesa.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Mesa.prototype, "updated_at", void 0);
exports.Mesa = Mesa = __decorate([
    (0, typeorm_1.Entity)({ name: 'mesa' })
], Mesa);
//# sourceMappingURL=mesa.entity.js.map