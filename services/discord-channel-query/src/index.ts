import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordChannelCacheHttpClient } from '@blargbot/discord-channel-cache-client';
import { DiscordChoiceQueryMessageBroker } from '@blargbot/discord-choice-query-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { DiscordChannelQueryService } from './DiscordChannelQueryService.js';

export class DiscordChannelQueryApplication extends ServiceHost {
    public constructor(options: DiscordChannelQueryApplicationOptions) {
        const serviceName = 'discord-channel-query';
        const hub = new MessageHub(options.messages);
        const choices = new DiscordChoiceQueryMessageBroker(hub, serviceName);
        const service = new DiscordChannelQueryService(
            new DiscordChannelCacheHttpClient(options.channelCache.url)
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => choices.handleSelectOptionsRequest(serviceName, m => service.renderChannelSelect(m)), 'handleQueryRequest')
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordChannelQueryApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        },
        channelCache: {
            url: env.discordChannelCacheUrl
        },
        channelSearch: {
            url: env.discordChannelSearchUrl
        }
    }));
}

export interface DiscordChannelQueryApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly channelSearch: {
        readonly url: string;
    };
    readonly channelCache: {
        readonly url: string;
    };
}
