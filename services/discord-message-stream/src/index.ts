import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsMessageBroker, MetricsService } from '@blargbot/metrics-client';

import { DiscordMessageStreamMessageBroker } from './DiscordMessageStreamMessageBroker.js';
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
    }
}])
export class DiscordMessageStreamApplication extends ServiceHost {
    public constructor(options: DiscordMessageStreamApplicationOptions) {
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsService(new MetricsMessageBroker(messages), {
            serviceName: 'discord-message-stream',
            instanceId: fullContainerId
        });
        const service = new DiscordMessageStreamService(
            new DiscordMessageStreamMessageBroker(messages),
            new DiscordGatewayMessageBroker(messages, 'discord-message-stream'),
            metrics,
            {
                discordChannelCacheUrl: options.discordChannelCache.url,
                discordGuildCacheUrl: options.discordGuildCache.url
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
}
