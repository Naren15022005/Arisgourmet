import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Outbox } from '../entities/outbox.entity';
import Redis from 'ioredis';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

const MAX_ATTEMPTS = Number(process.env.OUTBOX_MAX_ATTEMPTS || 5);
const BASE_BACKOFF_SEC = Number(process.env.OUTBOX_BASE_BACKOFF_SEC || 60);
const BATCH_SIZE = Number(process.env.OUTBOX_BATCH_SIZE || 10);

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
    const now = new Date();
    const rows = await repo.find({ where: { processed: false }, take: BATCH_SIZE, order: { created_at: 'ASC' } as any });
    for (const r of rows) {
      try {
        if (r.next_retry_at && r.next_retry_at > now) {
          continue; // skip until retry window
        }

        if (typeof r.attempts !== 'number') r.attempts = 0;

        if (r.attempts >= MAX_ATTEMPTS) {
          r.processed = true;
          r.processed_at = new Date();
          r.last_error = `max attempts reached (${r.attempts})`;
          await repo.save(r as any);
          console.warn('Outbox moved to DLQ (marked processed) id', r.id);
          continue;
        }

        // increment attempt immediately to claim work
        r.attempts = r.attempts + 1;
        // set a provisional next_retry in case publish blocks or fails
        const provisionalBackoff = computeBackoff(r.attempts);
        r.next_retry_at = new Date(Date.now() + provisionalBackoff);
        await repo.save(r as any);

        const channel = `${r.aggregate_type}:${r.event_type}`;
        try {
          await redis.publish(channel, JSON.stringify(r.payload || {}));
          r.processed = true;
          r.processed_at = new Date();
          r.next_retry_at = null;
          r.last_error = null;
          await repo.save(r as any);
          console.log('Processed outbox id', r.id, '->', channel);
        } catch (err) {
          const errStr = err && err.stack ? err.stack : String(err);
          const backoffMs = computeBackoff(r.attempts + 1);
          r.last_error = errStr.substring(0, 1000);
          r.next_retry_at = new Date(Date.now() + backoffMs);
          await repo.save(r as any);
          console.error('Failed to publish outbox id', r.id, errStr);
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
  console.log('Outbox processor starting...');
  while (true) {
    try {
      await processBatch();
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
