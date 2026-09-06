import { getConfigExchange, getDiscordRestQueue, getHealthReporter } from '@blargbot/contracts';
import type { Logger } from '@blargbot/logger';
import type { RestManager } from '@discordeno/rest';
import type { ChannelModel } from 'amqplib';

import { consumeDiscordTokenUpdates } from './consumers/consumeDiscordTokenUpdates.js';
import { consumeRestProxyMessages } from './consumers/consumeRestProxyMessages.js';

export interface AmqpLoopOptions {
    connect: () => Promise<ChannelModel>;
    discord: RestManager;
    logger: Logger;
    signal: AbortSignal;
}

export async function runAmqpLoop(options: AmqpLoopOptions): Promise<void> {
    const { connect, discord, logger, signal } = options;
    while (!signal.aborted) {
        const abortController = new AbortController();
        const relay = (): void => abortController.abort(signal.reason);
        signal.addEventListener('abort', relay);
        const amqp = await connect();
        logger.init('Connected to AMQP:', amqp.connection.serverProperties.cluster_name);
        logger.verbose('AMQP properties', amqp.connection.serverProperties);
        amqp.on('close', () => abortController.abort(new Error('AMQP connection closed.')));

        const channel = await amqp.createChannel();
        const restQueue = await getDiscordRestQueue(channel);
        const configExchange = await getConfigExchange(channel);
        const health = await getHealthReporter(channel);

        await using _healthRegistration = await health.register('discord-rest-service', () => undefined);

        await consumeRestProxyMessages({ queue: restQueue, discord });
        await consumeDiscordTokenUpdates({ exchange: configExchange, discord, logger });

        const { promise, resolve } = Promise.withResolvers();
        amqp.on('close', resolve);
        await promise;
        logger.warn('AMQP connection closed, reconnecting.');
        signal.removeEventListener('abort', relay);
    }
}
