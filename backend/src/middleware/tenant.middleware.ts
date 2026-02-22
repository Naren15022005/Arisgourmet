import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _res: Response, next: NextFunction) {
    const header = ((req.headers && (req.headers['x-restaurante-id'] || req.headers['x-tenant-id'])) as string) || null;
    if (header) {
      req.restauranteId = header;
    }

    if (!req.restauranteId) {
      req.restauranteId = (req.query && (req.query['restaurante_id'] as string)) || (req.body && req.body.restaurante_id);
    }

    next();
  }
}
