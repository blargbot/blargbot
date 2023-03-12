import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import { DiscordMessageStreamMessageBroker } from '@blargbot/discord-message-stream-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

import { DiscordMessageStreamService } from './DiscordMessageStreamService.js';

@hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    },
    discordChannelCache: {
        url: env.discordChannelCacheUrl
    },
    discordGuildCache: {
        url: env.discordGuildCacheUrl
    },
    discordRoleCache: {
        url: env.discordRoleCacheUrl
    }
}])
export class DiscordMessageStreamApplication extends ServiceHost {
    public constructor(options: DiscordMessageStreamApplicationOptions) {
        const serviceName = 'discord-message-stream';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: fullContainerId });
        const service = new DiscordMessageStreamService(
            new DiscordMessageStreamMessageBroker(messages, serviceName),
            new DiscordGatewayMessageBroker(messages, serviceName),
            metrics,
            {
                discordChannelCacheUrl: options.discordChannelCache.url,
                discordGuildCacheUrl: options.discordGuildCache.url,
                discordRoleCacheUrl: options.discordRoleCache.url
            }
        );

        super([
            connectionToService(messages, 'rabbitmq'),
            metrics,
            service
        ]);
    }
}

export interface DiscordMessageStreamApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly discordChannelCache: {
        readonly url: string;
    };
    readonly discordGuildCache: {
        readonly url: string;
    };
    readonly discordRoleCache: {
        readonly url: string;
    };
}
