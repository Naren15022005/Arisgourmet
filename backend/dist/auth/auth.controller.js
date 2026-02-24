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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const refresh_service_1 = require("./refresh.service");
let AuthController = class AuthController {
    constructor(authService, refreshService) {
        this.authService = authService;
        this.refreshService = refreshService;
    }
    async register(body) {
        const { email, nombre, password, role, restaurante_id } = body;
        const user = await this.authService.register(email, nombre, password, role, restaurante_id);
        const u = Array.isArray(user) ? user[0] : user;
        return { id: u.id, email: u.email, nombre: u.nombre };
    }
    async login(body) {
        const { email, password } = body;
        const user = await this.authService.validateUser(email, password);
        if (!user)
            return { error: 'invalid_credentials' };
        const token = this.authService.generateToken({ sub: user.id, email: user.email, role: user.role, restaurante_id: user.restaurante_id });
        // create a rotating refresh token
        const refresh = await this.refreshService.createForUser(user);
        return { access_token: token, refresh_token: refresh };
    }
    async refresh(body) {
        const { refresh_token } = body;
        if (!refresh_token)
            return { error: 'missing_refresh_token' };
        const result = await this.refreshService.rotate(refresh_token);
        return result;
    }
    async logout(body) {
        const { refresh_token } = body;
        if (!refresh_token)
            return { error: 'missing_refresh_token' };
        const ok = await this.refreshService.revoke(refresh_token);
        return { success: ok };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Post)('logout'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService, refresh_service_1.RefreshService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map