import { config } from '@blargbot/config';
import { createLogger } from '@blargbot/logger';
import { createRestManager } from '@discordeno/rest';
import amqplib from 'amqplib';

import { runAmqpLoop } from './runAmqpLoop.js';

const logger = createLogger(config, 'REST');
logger.setGlobal();

const discord = createRestManager({
    token: config.discord.token,
    applicationId: config.discord.applicationId,
    logger
});

await runAmqpLoop({
    connect: () => amqplib.connect(config.amqp.url),
    discord,
    logger,
    signal: new AbortController().signal
});
