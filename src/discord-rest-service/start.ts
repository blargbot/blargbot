import { config } from '@blargbot/config';
import { AmqpConnection } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { createRestManager } from '@discordeno/rest';

import { setupAmqp } from './setupAmqp.js';

const logger = createLogger(config, 'DRS');
logger.setGlobal();

const discord = createRestManager({
    token: config.discord.token,
    applicationId: config.discord.applicationId,
    logger
});

const amqp = new AmqpConnection(config.amqp.url, { logger });
const amqpChannel = amqp.createChannel();
await setupAmqp(amqpChannel, discord, logger);
