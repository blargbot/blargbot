import { config } from '@blargbot/config';
import { AmqpConnection } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { whenAborted } from '@blargbot/util';
import { createRestManager } from '@discordeno/rest';

import { setupAmqp } from './setupAmqp.js';

const logger = createLogger(config, 'REST');
logger.setGlobal();

const discord = createRestManager({
    token: config.discord.token,
    applicationId: config.discord.applicationId,
    logger
});

const amqp = new AmqpConnection(config.amqp.url);
amqp.onError(err => logger.error('[AMQP]', err));
amqp.onConnected(signal => {
    logger.init('[AMQP] internal connection established.');
    whenAborted(signal, () => logger.warn('[AMQP] internal connection closed.'));
});
const amqpChannel = amqp.createChannel();
await setupAmqp(amqpChannel, discord, logger);
