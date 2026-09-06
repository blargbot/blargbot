import { config } from '@blargbot/config';
import { getConfigExchange, getDiscordRestQueue } from '@blargbot/contracts';
import { createLogger } from '@blargbot/logger';
import { createRestManager } from '@discordeno/rest';
import amqplib from 'amqplib';

import { createRequestHandler } from './publishers/createRequestHandler.js';

const logger = createLogger(config, 'TEST');
logger.setGlobal();

const discord = createRestManager({
    token: config.discord.token
});
const amqp = await amqplib.connect(config.amqp.url);
const channel = await amqp.createChannel();
const queue = await getDiscordRestQueue(channel);
const cfg = await getConfigExchange(channel);

discord.makeRequest = createRequestHandler({ queue, discord });

const start = performance.now();
logger.info(await discord.getGatewayBot());
logger.info(`Elapsed: ${performance.now() - start}ms`);
await cfg.send('set-discord-token', 'My test token');

setTimeout(() => void amqp.close(), 10);
