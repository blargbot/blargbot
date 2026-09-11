import { config } from '@blargbot/config';
import { AmqpConnection } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { whenAborted } from '@blargbot/util';

import { setupAmqp } from './setupAmqp.js';
import { ShardManager } from './ShardManager.js';

const clusterId = pickRandom('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8).join('');
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
setInterval(tickPostStats, 60_000);
tickPostStats();

function pickRandom<T>(source: ArrayLike<T>, count: number): T[] {
    return Array.from({ length: count }, () => source[Math.floor(Math.random() * source.length)]);
}

function tickPostStats(): void {
    shards.postStats().catch(err => logger.error('Error while posting stats', err));
}
