import { config } from '@blargbot/config';
import { AmqpConnection, getDiscordGatewayChannel } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { createId, whenAborted } from '@blargbot/util';

import { relayMessage } from './relayMessage.js';

const clusterId = createId();
const logger = createLogger(config, `CLUSTER ${clusterId}`);
logger.setGlobal();

const amqp = new AmqpConnection(config.amqp.url);
amqp.onError(err => logger.error('[AMQP]', err));
amqp.onConnected(signal => {
    logger.init('[AMQP] internal connection established.');
    whenAborted(signal, () => logger.warn('[AMQP] internal connection closed.'));
});
const amqpChannel = amqp.createChannel();

const gateway = await getDiscordGatewayChannel(amqpChannel);

await gateway.deletePartitions(32);
await gateway.assertPartitions(32);

await gateway.handleDeduped(async raw => {
    await Promise.all(
        relayMessage(raw)
            .map(([message, key]) => gateway.publish(message, key))
    );
});
