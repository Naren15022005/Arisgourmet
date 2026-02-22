import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req: any, _res: Response, next: NextFunction) {
    const auth = (req.headers && req.headers['authorization']) as string;
    if (!auth) {
      throw new UnauthorizedException('Missing Authorization header');
    }

    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException('Invalid Authorization header');
    }

    const token = parts[1];
    try {
      const secret = process.env.JWT_SECRET || 'dev-secret';
      const decoded = jwt.verify(token, secret as string);
      req.user = decoded;
      // also set restauranteId from token if present
      if ((decoded as any).restaurante_id) (req as any).restauranteId = (decoded as any).restaurante_id;
      next();
    } catch (err) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
