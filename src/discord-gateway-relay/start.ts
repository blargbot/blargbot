import { config } from '@blargbot/config';
import { AmqpConnection, getDiscordGatewayChannel } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';

import { relayMessage } from './relayMessage.js';

const logger = createLogger(config, 'DGR');
logger.setGlobal();

const amqp = new AmqpConnection(config.amqp.url, { logger });
const amqpChannel = amqp.createChannel();

const gateway = await getDiscordGatewayChannel(amqpChannel);

await gateway.handleDeduped(async raw => {
    await Promise.all(
        relayMessage(raw)
            .map(([message, key]) => gateway.publish(message, key))
    );
});
