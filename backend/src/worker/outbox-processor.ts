import { AppDataSource } from '../data-source';
import Redis from 'ioredis';
import * as promClient from 'prom-client';
import { Outbox } from '../entities/outbox.entity';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function processBatch(redis: any) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const rows = await queryRunner.manager
      .createQueryBuilder(Outbox, 'o')
      .setLock('pessimistic_write')
      .where('o.processed = :p', { p: false })
      .orderBy('o.id', 'ASC')
      .limit(50)
      .getMany();

    if (!rows || rows.length === 0) {
      await queryRunner.rollbackTransaction();
      return 0;
    }

    for (const r of rows) {
      const channel = `events.${r.aggregate_type}`;
      const message = JSON.stringify({ id: r.id, event_type: r.event_type, payload: r.payload, aggregate_id: r.aggregate_id, created_at: r.created_at });
      try {
        await redis.publish(channel, message);
        r.processed = true as any;
        r.processed_at = new Date();
        await queryRunner.manager.save(r);
        console.log('Published outbox id=', r.id, 'to', channel);
      } catch (err) {
        console.error('Failed publish for outbox id=', r.id, err);
        throw err;
      }
    }

    await queryRunner.commitTransaction();
    return rows.length;
  } catch (err) {
    console.error('Outbox batch error, rolling back', err);
    try {
      await queryRunner.rollbackTransaction();
    } catch (e) {}
    return 0;
  } finally {
    try {
      await queryRunner.release();
    } catch (e) {}
  }
}

async function main() {
  console.log('Outbox processor starting...');
  await AppDataSource.initialize();
  console.log('DB initialized');
  const redis = new Redis({ host: process.env.REDIS_HOST || 'redis' });
  // metrics
  if (typeof promClient.collectDefaultMetrics === 'function') promClient.collectDefaultMetrics();
  const publishedCounter = new promClient.Counter({ name: 'outbox_published_total', help: 'Outbox published count' });
  const failedCounter = new promClient.Counter({ name: 'outbox_failed_total', help: 'Outbox failed count' });

  let stopped = false;
  process.on('SIGINT', () => { stopped = true; });
  process.on('SIGTERM', () => { stopped = true; });

  while (!stopped) {
    try {
      const n = await processBatch(redis);
      if (n === 0) {
        await sleep(2000);
      }
      if (n > 0) publishedCounter.inc(n);
    } catch (err) {
      console.error('Outbox processor main loop error', err);
      failedCounter.inc();
      await sleep(5000);
    }
  }

  console.log('Outbox processor stopping');
  try { await redis.quit(); } catch (e) {}
  try { await AppDataSource.destroy(); } catch (e) {}
  process.exit(0);
}

main().catch((err) => {
  console.error('Outbox processor fatal', err);
  process.exit(1);
});
