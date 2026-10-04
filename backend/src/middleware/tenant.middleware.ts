import { Injectable, NestMiddleware } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  // Caché en memoria para resolución ultrarrápida (sub-milisegundo) de slug -> UUID
  private slugCache = new Map<string, string>();

  constructor(private readonly dataSource: DataSource) {}

  async use(req: any, _res: Response, next: NextFunction) {
    const header = ((req.headers && (req.headers['x-restaurante-id'] || req.headers['x-tenant-id'])) as string) || null;
    let candidate = header;

    if (!candidate) {
      const fromQuery = req.query && (req.query['restaurante_id'] || req.query['r']);
      const fromBody = req.body && (req.body.restaurante_id || req.body.r);
      candidate = fromQuery ?? fromBody;
    }

    if (candidate !== undefined && candidate !== null) {
      const str = String(candidate).trim();
      if (this.slugCache.has(str)) {
        req.restauranteId = this.slugCache.get(str);
        req.restauranteSlug = str;
      } else {
        try {
          const rows = await this.dataSource.query(
            'SELECT id, slug FROM restaurante WHERE id = ? OR slug = ? LIMIT 1',
            [str, str],
          );
          if (rows && rows.length > 0) {
            const canonicalId = rows[0].id;
            const canonicalSlug = rows[0].slug;
            req.restauranteId = canonicalId;
            req.restauranteSlug = canonicalSlug;
            this.slugCache.set(canonicalId, canonicalId);
            if (canonicalSlug) {
              this.slugCache.set(canonicalSlug, canonicalId);
            }
          } else {
            req.restauranteId = str;
          }
        } catch {
          req.restauranteId = str;
        }
      }
    }

    next();
  }
}
