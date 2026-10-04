import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Server } from 'socket.io';
import Redis from 'ioredis';

/**
 * NotificationsService
 *
 * Provides two things:
 * 1. A socket.io server attached to the NestJS HTTP server.
 *    Clients join their restaurante room via `socket.emit('join', restauranteId)`.
 *
 * 2. A Redis subscriber that listens to channels published by the outbox worker
 *    and relays events to connected WebSocket clients.
 *
 * Redis channel convention (set by outbox worker):
 *   `{aggregate_type}:{event_type}` — e.g. `pedido:CREADO`, `pedido:ESTADO_ACTUALIZADO`
 *
 * Env vars:
 *   REDIS_URL (default: redis://localhost:6379)
 */
@Injectable()
export class NotificationsService implements OnModuleDestroy {
  private io?: Server;
  private subscriber?: Redis;

  constructor(private readonly dataSource?: DataSource) {}

  /** Call this once the HTTP server is ready (in main.ts bootstrap). */
  init(httpServer: any): void {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    this.io = new Server(httpServer, {
      cors: { origin: '*', methods: ['GET', 'POST'] },
      path: '/notifications',
      transports: ['websocket', 'polling'],
      pingInterval: 15000,
      pingTimeout: 10000,
      allowEIO3: true,
      maxHttpBufferSize: 1e6,
    });

    this.io.on('connection', (socket) => {
      console.log('[ws] client connected', socket.id);

      // Client should emit 'join' with its restaurante_id (or slug) to subscribe to events
      socket.on('join', async (restauranteIdOrSlug: string) => {
        if (restauranteIdOrSlug) {
          const raw = String(restauranteIdOrSlug).trim();
          socket.join(`restaurante:${raw}`);
          socket.emit('joined', { restaurante_id: raw });
          console.log('[ws] client', socket.id, 'joined restaurante:', raw);

          if (this.dataSource) {
            try {
              const rows = await this.dataSource.query(
                'SELECT id, slug FROM restaurante WHERE id = ? OR slug = ? LIMIT 1',
                [raw, raw],
              );
              if (rows && rows.length > 0) {
                const { id, slug } = rows[0];
                if (id && id !== raw) socket.join(`restaurante:${id}`);
                if (slug && slug !== raw) socket.join(`restaurante:${slug}`);
              }
            } catch {
              // ignore
            }
          }
        }
      });

      socket.on('disconnect', () => {
        console.log('[ws] client disconnected', socket.id);
      });
    });

    // Subscribe to outbox-published Redis channels
    this.subscriber = new Redis(redisUrl);

    // Subscribe to pedido and mesa channels
    this.subscriber.psubscribe('pedido:*', 'mesa:*', (err, count) => {
      if (err) {
        console.error('[ws] Redis psubscribe error:', err.message);
      } else {
        console.log(`[ws] Subscribed to ${count} Redis pattern(s)`);
      }
    });

    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      try {
        const payload = JSON.parse(message);
        const restauranteId: string | undefined = payload?.restaurante_id;
        if (restauranteId) {
          this.io?.to(`restaurante:${restauranteId}`).emit(channel, payload);
        } else {
          // Broadcast to all if no restaurante context
          this.io?.emit(channel, payload);
        }
      } catch {
        console.warn('[ws] Failed to parse Redis message on channel', channel);
      }
    });

    console.log('[ws] NotificationsService initialized at path /notifications');
  }

  /** Emit directly from backend code (bypass outbox). */
  emitToRestaurante(restauranteId: string, event: string, data: unknown): void {
    this.io?.to(`restaurante:${restauranteId}`).emit(event, data);
  }

  /** Broadcast to all connected clients. */
  broadcast(event: string, data: unknown): void {
    this.io?.emit(event, data);
  }

  onModuleDestroy(): void {
    this.subscriber?.disconnect();
    this.io?.close();
  }
}
