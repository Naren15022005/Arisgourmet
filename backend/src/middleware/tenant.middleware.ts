import { Injectable, NestMiddleware } from '@nestjs/common';
import { Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: any, _res: Response, next: NextFunction) {
    const header = ((req.headers && (req.headers['x-restaurante-id'] || req.headers['x-tenant-id'])) as string) || null;
    if (header) {
      const parsed = Number(header);
      req.restauranteId = Number.isFinite(parsed) ? parsed : header;
    }

    if (!req.restauranteId) {
      const fromQuery = req.query && (req.query['restaurante_id'] as string);
      const fromBody = req.body && req.body.restaurante_id;
      const candidate = fromQuery ?? fromBody;
      if (candidate !== undefined && candidate !== null) {
        const parsed = Number(candidate);
        req.restauranteId = Number.isFinite(parsed) ? parsed : candidate;
      }
    }

    next();
  }
}
