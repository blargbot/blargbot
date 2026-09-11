import { config } from '@blargbot/config';
import { AmqpConnection, getDiscordClusterChannel, getDiscordRestChannel } from '@blargbot/contracts';
import { createRequestHandler } from '@blargbot/discord-rest-service';
import { createLogger } from '@blargbot/logger';
import { whenAborted } from '@blargbot/util';
import { createGatewayManager } from '@discordeno/gateway';
import { createRestManager } from '@discordeno/rest';
import { GatewayIntents } from '@discordeno/types';

import { installDistributedSharding } from './installDistributedSharding.js';

const logger = createLogger(config, 'TEST');
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

const restChannel = await getDiscordRestChannel(amqpChannel);
const clusterChannel = await getDiscordClusterChannel(amqpChannel, 'TEST');

discord.makeRequest = createRequestHandler({
    discord,
    queue: restChannel
});

const botInfo = await discord.getGatewayBot();
const gateway = createGatewayManager({
    token: config.discord.token,
    intents: GatewayIntents.Guilds
        | GatewayIntents.GuildMembers
        | GatewayIntents.GuildModeration
        | GatewayIntents.GuildPresences
        | GatewayIntents.GuildMessages
        | GatewayIntents.GuildMessageReactions
        | GatewayIntents.GuildExpressions
        | GatewayIntents.DirectMessages
        | GatewayIntents.DirectMessageReactions,
    connection: botInfo,
    totalShards: botInfo.shards,
    logger,
    resharding: {
        enabled: true,
        shardsFullPercentage: 80,
        checkInterval: 8 * 60 * 60_000,
        getSessionInfo: discord.getGatewayBot
    }
});

await installDistributedSharding({ gateway, channel: clusterChannel });

await gateway.spawnShards();
