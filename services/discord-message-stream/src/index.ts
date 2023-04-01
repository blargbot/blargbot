import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import { DiscordMessageStreamMessageBroker } from '@blargbot/discord-message-stream-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { Metrics, MetricsPushService } from '@blargbot/metrics-client';

import { DiscordMessageStreamService } from './DiscordMessageStreamService.js';

export class DiscordMessageStreamApplication extends ServiceHost {
    public constructor(options: DiscordMessageStreamApplicationOptions) {
        const serviceName = 'discord-message-stream';
        const hub = new MessageHub(options.messages);
        const metrics = new Metrics({ serviceName, instanceId: fullContainerId });
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordMessageStreamService(
            new DiscordMessageStreamMessageBroker(hub, serviceName),
            metrics,
            {
                discordChannelCacheUrl: options.discordChannelCache.url,
                discordGuildCacheUrl: options.discordGuildCache.url,
                discordRoleCacheUrl: options.discordRoleCache.url
            }
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService(metrics)
            ),
            connectToService(() => gateway.handleMessageCreate(m => service.handleMessageCreate(m)), 'handleMessageCreate')
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordMessageStreamApplication({
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

    }));
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
