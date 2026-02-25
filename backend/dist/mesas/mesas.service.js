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
exports.MesasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const mesa_entity_1 = require("../entities/mesa.entity");
const mesa_entity_2 = require("../entities/mesa.entity");
let MesasService = class MesasService {
    constructor(mesaRepo) {
        this.mesaRepo = mesaRepo;
    }
    async findAll(restauranteId) {
        const restId = restauranteId ? String(restauranteId) : undefined;
        const where = restId ? { restaurante_id: restId } : {};
        return this.mesaRepo.find({ where });
    }
    async activate(codigo, restauranteId) {
        const where = { codigo };
        const restId = restauranteId ? String(restauranteId) : undefined;
        if (restId)
            where.restaurante_id = restId;
        const mesa = await this.mesaRepo.findOneBy(where);
        if (!mesa)
            throw new common_1.NotFoundException('Mesa no encontrada');
        mesa.estado = mesa_entity_2.MesaEstado.OCUPADA;
        return this.mesaRepo.save(mesa);
    }
    async release(codigo, restauranteId) {
        const where = { codigo };
        const restId = restauranteId ? String(restauranteId) : undefined;
        if (restId)
            where.restaurante_id = restId;
        const mesa = await this.mesaRepo.findOneBy(where);
        if (!mesa)
            throw new Error('Mesa no encontrada');
        mesa.estado = mesa_entity_2.MesaEstado.LIBRE;
        return this.mesaRepo.save(mesa);
    }
};
exports.MesasService = MesasService;
exports.MesasService = MesasService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(mesa_entity_1.Mesa)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], MesasService);
//# sourceMappingURL=mesas.service.js.map