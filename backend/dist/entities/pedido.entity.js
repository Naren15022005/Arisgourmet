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
exports.Pedido = exports.PedidoEstado = void 0;
const typeorm_1 = require("typeorm");
const item_pedido_entity_1 = require("./item-pedido.entity");
var PedidoEstado;
(function (PedidoEstado) {
    PedidoEstado["PENDIENTE"] = "pendiente";
    PedidoEstado["ACEPTADO"] = "aceptado";
    PedidoEstado["PREPARANDO"] = "preparando";
    PedidoEstado["LISTO"] = "listo";
    PedidoEstado["ENTREGADO"] = "entregado";
    PedidoEstado["CANCELADO"] = "cancelado";
})(PedidoEstado || (exports.PedidoEstado = PedidoEstado = {}));
let Pedido = class Pedido {
};
exports.Pedido = Pedido;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Pedido.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'mesa_id', type: 'varchar', length: 255 }),
    __metadata("design:type", String)
], Pedido.prototype, "mesa_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'restaurante_id', type: 'varchar', length: 255, nullable: true }),
    __metadata("design:type", String)
], Pedido.prototype, "restaurante_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: PedidoEstado, default: PedidoEstado.PENDIENTE }),
    __metadata("design:type", String)
], Pedido.prototype, "estado", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => item_pedido_entity_1.ItemPedido, (item) => item.pedido, { cascade: true }),
    __metadata("design:type", Array)
], Pedido.prototype, "items", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Pedido.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'datetime', precision: 6 }),
    __metadata("design:type", Date)
], Pedido.prototype, "updated_at", void 0);
exports.Pedido = Pedido = __decorate([
    (0, typeorm_1.Entity)({ name: 'pedido' })
], Pedido);
//# sourceMappingURL=pedido.entity.js.map