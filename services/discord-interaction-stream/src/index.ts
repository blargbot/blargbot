import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';

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
        const messages = new MessageHub(options.messages);
        const service = new DiscordInteractionStreamService(
            new DiscordInteractionStreamMessageBroker(messages),
            new DiscordGatewayMessageBroker(messages, 'discord-interaction-stream')
        );

        super([
            connectionToService(messages, 'rabbitmq'),
            service
        ]);
    }
}

export interface DiscordInteractionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
