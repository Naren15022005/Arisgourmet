"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtMiddleware = void 0;
const common_1 = require("@nestjs/common");
const jwt = require("jsonwebtoken");
let JwtMiddleware = class JwtMiddleware {
    use(req, _res, next) {
        const auth = (req.headers && req.headers['authorization']);
        if (!auth) {
            throw new common_1.UnauthorizedException('Missing Authorization header');
        }
        const parts = auth.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            throw new common_1.UnauthorizedException('Invalid Authorization header');
        }
        const token = parts[1];
        try {
            const secret = process.env.JWT_SECRET || 'dev-secret';
            const decoded = jwt.verify(token, secret);
            req.user = decoded;
            // also set restauranteId from token if present
            if (decoded.restaurante_id)
                req.restauranteId = decoded.restaurante_id;
            next();
        }
        catch (err) {
            throw new common_1.UnauthorizedException('Invalid token');
        }
    }
};
exports.JwtMiddleware = JwtMiddleware;
exports.JwtMiddleware = JwtMiddleware = __decorate([
    (0, common_1.Injectable)()
], JwtMiddleware);
//# sourceMappingURL=jwt.middleware.js.map