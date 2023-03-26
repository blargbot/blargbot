import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { DiscordReactionStreamMessageBroker } from './DiscordReactionStreamMessageBroker.js';
import { DiscordReactionStreamService } from './DiscordReactionStreamService.js';

@hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    }
}])
export class DiscordReactionStreamApplication extends ServiceHost {
    public constructor(options: DiscordReactionStreamApplicationOptions) {
        const serviceName = 'discord-reaction-stream';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsPushService({ serviceName, instanceId: fullContainerId });
        const service = new DiscordReactionStreamService(
            new DiscordReactionStreamMessageBroker(messages),
            new DiscordGatewayMessageBroker(messages, serviceName)
        );
        super([
            connectionToService(messages, 'rabbitmq'),
            metrics,
            service
        ]);
    }
}

export interface DiscordReactionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
