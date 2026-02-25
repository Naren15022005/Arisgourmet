import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Outbox } from '../entities/outbox.entity';
import Redis from 'ioredis';
import { randomUUID } from 'crypto';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || 5);
const BASE_BACKOFF_SEC = Number(process.env.OUTBOX_BASE_BACKOFF_SEC || 60);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 10);
const IDEMPOTENCY_TTL_SEC = Number(process.env.OUTBOX_IDEMPOTENCY_TTL_SEC || 86400);

const workerId = process.env.OUTBOX_WORKER_ID || randomUUID();
const counters = {
  processed: 0,
  retried: 0,
  dlq: 0,
  skippedLocked: 0,
};

function computeBackoff(attempts: number) {
  // exponential backoff: base * 2^(attempts-1)
  const multiplier = Math.max(1, Math.pow(2, Math.max(0, attempts - 1)));
  return BASE_BACKOFF_SEC * multiplier * 1000;
}

async function processBatch(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Outbox);
  const redis = new Redis(redisUrl);

  try {
    const outboxExists = await AppDataSource.query(
      "SELECT COUNT(*) as c FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='outbox'",
    );
    if (!outboxExists || !outboxExists[0] || Number(outboxExists[0].c) === 0) {
      console.warn('Outbox table is not present yet. Waiting for schema provisioning...');
      return;
    }

    const now = new Date();
    const rows = await repo
      .createQueryBuilder('o')
      .where('o.processed = :processed', { processed: false })
      .andWhere('o.dlq = :dlq', { dlq: false })
      .andWhere('(o.next_retry_at IS NULL OR o.next_retry_at <= :now)', { now })
      .orderBy('o.created_at', 'ASC')
      .take(BATCH_SIZE)
      .getMany();

    for (const r of rows) {
      try {
        if (typeof r.attempts !== 'number') r.attempts = 0;

        if (r.attempts >= MAX_ATTEMPTS) {
          r.dlq = true;
          r.dlq_reason = `max attempts reached (${r.attempts})`;
          r.last_error = `max attempts reached (${r.attempts})`;
          await repo.save(r as any);
          counters.dlq += 1;
          console.warn('Outbox moved to DLQ id', r.id);
          continue;
        }

        // claim row optimistically to avoid multi-worker duplicate processing
        const claimBackoff = computeBackoff(r.attempts + 1);
        const claimUntil = new Date(Date.now() + claimBackoff);
        const claimResult = await repo
          .createQueryBuilder()
          .update(Outbox)
          .set({
            attempts: () => 'attempts + 1',
            next_retry_at: claimUntil,
            last_error: `claimed by ${workerId}`,
          } as any)
          .where('id = :id', { id: r.id })
          .andWhere('processed = :processed', { processed: false })
          .andWhere('dlq = :dlq', { dlq: false })
          .andWhere('(next_retry_at IS NULL OR next_retry_at <= :now)', { now: new Date() })
          .execute();

        if (!claimResult.affected || claimResult.affected === 0) {
          counters.skippedLocked += 1;
          continue;
        }

        const fresh = await repo.findOne({ where: { id: r.id as any } });
        if (!fresh) continue;

        const channel = `${fresh.aggregate_type}:${fresh.event_type}`;
        try {
          const idempotencyKey = `outbox:idempotency:${fresh.id}`;
          const first = await redis.set(idempotencyKey, '1', 'EX', IDEMPOTENCY_TTL_SEC, 'NX');
          if (first === null) {
            fresh.processed = true;
            fresh.processed_at = new Date();
            fresh.last_error = null;
            fresh.next_retry_at = null;
            await repo.save(fresh as any);
            counters.processed += 1;
            continue;
          }

          await redis.publish(channel, JSON.stringify(fresh.payload || {}));
          fresh.processed = true;
          fresh.processed_at = new Date();
          fresh.next_retry_at = null;
          fresh.last_error = null;
          fresh.dlq = false;
          fresh.dlq_reason = null;
          await repo.save(fresh as any);
          counters.processed += 1;
          console.log('Processed outbox id', fresh.id, '->', channel);
        } catch (err) {
          const errStr = err && err.stack ? err.stack : String(err);
          const backoffMs = computeBackoff((fresh.attempts || 0) + 1);
          fresh.last_error = errStr.substring(0, 1000);
          fresh.next_retry_at = new Date(Date.now() + backoffMs);
          if ((fresh.attempts || 0) >= MAX_ATTEMPTS) {
            fresh.dlq = true;
            fresh.dlq_reason = 'publish failure after max attempts';
            counters.dlq += 1;
          } else {
            counters.retried += 1;
          }
          await repo.save(fresh as any);
          console.error('Failed to publish outbox id', fresh.id, errStr);
        }
      } catch (inner) {
        console.error('Unexpected error processing outbox id', r && (r as any).id, inner && inner.stack ? inner.stack : inner);
      }
    }
  } finally {
    await redis.quit();
    await AppDataSource.destroy();
  }
}

async function main() {
  console.log('Outbox processor starting...', { workerId, maxAttempts: MAX_ATTEMPTS, batchSize: BATCH_SIZE });
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await processBatch();
      console.log('Outbox metrics', counters);
    } catch (err) {
      console.error('Outbox batch error', err && err.stack ? err.stack : err);
    }
    await sleep(2000);
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error('Fatal outbox error', e && e.stack ? e.stack : e);
    process.exit(1);
  });
}
