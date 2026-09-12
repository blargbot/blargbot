import { randomUUID } from 'node:crypto';

import { config } from '@blargbot/config';
import { AmqpConnection } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { createId, whenAborted } from '@blargbot/util';

import { setupAmqp } from './setupAmqp.js';
import { ShardManager } from './ShardManager.js';

const clusterId = createId();
const logger = createLogger(config, `CLUSTER ${clusterId}`);
logger.setGlobal();

const shards = new ShardManager(clusterId, logger);
const killWorker = new AbortController();

const amqp = new AmqpConnection(config.amqp.url);
amqp.onError(err => logger.error('[AMQP]', err));
amqp.onConnected(signal => {
    logger.init('[AMQP] internal connection established.');
    whenAborted(signal, () => logger.warn('[AMQP] internal connection closed.'));
});
const amqpChannel = amqp.createChannel();
await setupAmqp(amqpChannel, shards, killWorker);
const postStats = setInterval(tickPostStats, 5_000);
tickPostStats();

whenAborted(killWorker.signal, () => {
    amqp[Symbol.dispose]();
    shards.switchShards({ groupId: randomUUID() });
    clearInterval(postStats);
    shards.pruneShards().catch(() => { });
    setTimeout(() => process.exit(0), 10_000).unref();
});

function tickPostStats(): void {
    shards.postStats().catch(err => logger.error('Error while posting stats', err));
}
