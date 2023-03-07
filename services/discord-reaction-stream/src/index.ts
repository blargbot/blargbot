import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';

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
        const messages = new MessageHub(options.messages);
        const service = new DiscordReactionStreamService(
            new DiscordReactionStreamMessageBroker(messages),
            new DiscordGatewayMessageBroker(messages, 'discord-reaction-stream')
        );
        super([
            connectionToService(messages, 'rabbitmq'),
            service
        ]);
    }
}

export interface DiscordReactionStreamApplicationOptions {
    readonly messages: ConnectionOptions;
}
