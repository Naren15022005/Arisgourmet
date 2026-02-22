import 'reflect-metadata';
import { AppDataSource } from '../data-source';
import { Outbox } from '../entities/outbox.entity';
import Redis from 'ioredis';

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processBatch(redisUrl = process.env.REDIS_URL || 'redis://localhost:6379') {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Outbox);
  const redis = new Redis(redisUrl);

  try {
    const rows = await repo.find({ where: { processed: false }, take: 10 });
    for (const r of rows) {
      const channel = `${r.aggregate_type}:${r.event_type}`;
      try {
        await redis.publish(channel, JSON.stringify(r.payload || {}));
        r.processed = true;
        r.processed_at = new Date();
        await repo.save(r as any);
        console.log('Processed outbox id', r.id, '->', channel);
      } catch (err) {
        console.error('Failed to process outbox id', r.id, err && err.stack ? err.stack : err);
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
