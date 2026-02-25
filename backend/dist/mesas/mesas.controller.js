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
exports.MesasController = void 0;
const common_1 = require("@nestjs/common");
const passport_1 = require("@nestjs/passport");
const roles_decorator_1 = require("../auth/roles.decorator");
const roles_guard_1 = require("../auth/roles.guard");
const mesas_service_1 = require("./mesas.service");
let MesasController = class MesasController {
    constructor(mesasService) {
        this.mesasService = mesasService;
    }
    async findAll(req) {
        const restauranteId = req.restauranteId;
        return this.mesasService.findAll(restauranteId);
    }
    async activate(codigo_qr, req) {
        // `req.user` comes from JwtStrategy.validate
        const restauranteId = req.user?.restaurante_id || req.restauranteId;
        return this.mesasService.activate(codigo_qr, restauranteId);
    }
    async release(codigo_qr, req) {
        const restauranteId = req.user?.restaurante_id || req.restauranteId;
        return this.mesasService.release(codigo_qr, restauranteId);
    }
};
exports.MesasController = MesasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MesasController.prototype, "findAll", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt')),
    (0, common_1.Post)('activate'),
    __param(0, (0, common_1.Body)('codigo_qr')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MesasController.prototype, "activate", null);
__decorate([
    (0, common_1.UseGuards)((0, passport_1.AuthGuard)('jwt'), roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('host', 'admin'),
    (0, common_1.Post)('release'),
    __param(0, (0, common_1.Body)('codigo_qr')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MesasController.prototype, "release", null);
exports.MesasController = MesasController = __decorate([
    (0, common_1.Controller)('api/mesas'),
    __metadata("design:paramtypes", [mesas_service_1.MesasService])
], MesasController);
//# sourceMappingURL=mesas.controller.js.map