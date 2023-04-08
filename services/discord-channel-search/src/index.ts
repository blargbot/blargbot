import { connectToService, host, isEntrypoint, parallelServices, ServiceHost, webService } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordChannelCacheMessageBroker } from '@blargbot/discord-channel-cache-client';
import env from '@blargbot/env';
import express from '@blargbot/express';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';
import { SearchClient } from '@blargbot/search-client';

import { ChannelSearchService } from './ChannelSearchService.js';
import { createChannelSearchRequestHandler } from './createChannelSearchRequestHandler.js';

export class SearchApplication extends ServiceHost {
    public constructor(options: SearchApplicationOptions) {
        const serviceName = 'search';
        const hub = new MessageHub(options.messages);
        const channels = new DiscordChannelCacheMessageBroker(hub, serviceName);
        const service = new ChannelSearchService(
            new SearchClient({
                hub,
                serviceName,
                http: options.search.url
            })
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            parallelServices(
                connectToService(() => channels.handleChannelSet(c => service.setChannel(c)), 'handleChannelSet'),
                connectToService(() => channels.handleChannelDelete(c => service.deleteChannel(c)), 'handleChannelDelete')
            ),
            webService(
                express()
                    .use(express.urlencoded({ extended: true }))
                    .use(express.json())
                    .all('/*', createChannelSearchRequestHandler(service)),
                options.port
            )
        ]);
    }
}

if (isEntrypoint()) {
    host(new SearchApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        },
        port: env.appPort,
        search: {
            url: env.searchUrl
        }
    }));
}

export interface SearchApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly port: number;
    readonly search: {
        readonly url: string;
    };
}
