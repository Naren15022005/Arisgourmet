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
exports.HistorialEstadoPedido = void 0;
const typeorm_1 = require("typeorm");
const pedido_entity_1 = require("./pedido.entity");
let HistorialEstadoPedido = class HistorialEstadoPedido {
};
exports.HistorialEstadoPedido = HistorialEstadoPedido;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HistorialEstadoPedido.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => pedido_entity_1.Pedido, { nullable: false }),
    (0, typeorm_1.JoinColumn)({ name: 'pedido_id' }),
    __metadata("design:type", pedido_entity_1.Pedido)
], HistorialEstadoPedido.prototype, "pedido", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'pedido_id' }),
    __metadata("design:type", String)
], HistorialEstadoPedido.prototype, "pedido_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HistorialEstadoPedido.prototype, "estado_anterior", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], HistorialEstadoPedido.prototype, "estado_nuevo", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], HistorialEstadoPedido.prototype, "nota", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime' }),
    __metadata("design:type", Date)
], HistorialEstadoPedido.prototype, "created_at", void 0);
exports.HistorialEstadoPedido = HistorialEstadoPedido = __decorate([
    (0, typeorm_1.Entity)({ name: 'historial_estado_pedido' })
], HistorialEstadoPedido);
//# sourceMappingURL=historial-estado-pedido.entity.js.map