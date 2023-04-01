import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';
import { DiscordReactionStreamService } from './DiscordReactionStreamService.js';

export class DiscordReactionStreamApplication extends ServiceHost {
    public constructor(options: DiscordReactionStreamApplicationOptions) {
        const serviceName = 'discord-reaction-stream';
        const hub = new MessageHub(options.messages);
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordReactionStreamService(
            new DiscordReactionStreamMessageBroker(hub)
        );
        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            connectToService(() => gateway.handleMessageReactionAdd(m => service.handleMessageReactionAdd(m)), 'handleMessageReactionAdd')
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordReactionStreamApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        }

    }));
}

export interface DiscordReactionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
