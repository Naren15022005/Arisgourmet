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
exports.Outbox = void 0;
const typeorm_1 = require("typeorm");
let Outbox = class Outbox {
};
exports.Outbox = Outbox;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ type: 'bigint', unsigned: true }),
    __metadata("design:type", String)
], Outbox.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aggregate_type', length: 100 }),
    __metadata("design:type", String)
], Outbox.prototype, "aggregate_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'aggregate_id', length: 100, nullable: true }),
    __metadata("design:type", String)
], Outbox.prototype, "aggregate_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'event_type', length: 150 }),
    __metadata("design:type", String)
], Outbox.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Object)
], Outbox.prototype, "payload", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Outbox.prototype, "processed", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'int', default: 0 }),
    __metadata("design:type", Number)
], Outbox.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'last_error', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Outbox.prototype, "last_error", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'next_retry_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Outbox.prototype, "next_retry_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dlq', type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], Outbox.prototype, "dlq", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'dlq_reason', type: 'text', nullable: true }),
    __metadata("design:type", String)
], Outbox.prototype, "dlq_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'processed_at', type: 'datetime', nullable: true }),
    __metadata("design:type", Date)
], Outbox.prototype, "processed_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Outbox.prototype, "created_at", void 0);
exports.Outbox = Outbox = __decorate([
    (0, typeorm_1.Entity)({ name: 'outbox' })
], Outbox);
//# sourceMappingURL=outbox.entity.js.map