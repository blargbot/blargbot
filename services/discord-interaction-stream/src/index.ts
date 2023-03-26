import { connectToService, hostIfEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { DiscordInteractionStreamMessageBroker } from './DiscordInteractionStreamMessageBroker.js';
import { DiscordInteractionStreamService } from './DiscordInteractionStreamService.js';

@hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordInteractionStreamApplication extends ServiceHost {
    public constructor(options: DiscordInteractionStreamApplicationOptions) {
        const serviceName = 'discord-interaction-stream';
        const hub = new MessageHub(options.messages);
        const gateway = new DiscordGatewayMessageBroker(hub, serviceName);
        const service = new DiscordInteractionStreamService(
            new DiscordInteractionStreamMessageBroker(hub)
        );

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            connectToService(() => gateway.handleInteractionCreate(m => service.handleInteractionCreate(m)), 'handleInteractionCreate')
        ]);
    }
}

export interface DiscordInteractionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
