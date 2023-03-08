import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

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
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: fullContainerId });
        const service = new DiscordInteractionStreamService(
            new DiscordInteractionStreamMessageBroker(messages),
            new DiscordGatewayMessageBroker(messages, serviceName)
        );

        super([
            connectionToService(messages, 'rabbitmq'),
            metrics,
            service
        ]);
    }
}

export interface DiscordInteractionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
