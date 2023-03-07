import { randomUUID } from 'node:crypto';

import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';

import { GatewayMessageBroker } from '../GatewayMessageBroker.js';
import { createDiscordGatewayManager } from './DiscordGatewayManager.js';
import { createDiscordRestClient } from './DiscordRestClient.js';

@hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        username: env.rabbitUsername,
        password: env.rabbitPassword
    },
    managerId: randomUUID(),
    rest: {
        url: env.discordProxyUrl,
        secret: env.discordProxySecret
    },
    token: env.discordToken,
    shardsPerWorker: env.shardsPerWorker
}])
export class DiscordGatewayApplication extends ServiceHost {
    public constructor(options: DiscordGatewayApplicationOptions) {
        const messages = new MessageHub(options.messages);
        const manager = createDiscordGatewayManager({
            messages: new GatewayMessageBroker(messages, { managerId: options.managerId }),
            client: createDiscordRestClient({
                token: options.token,
                url: options.rest.url,
                secret: options.rest.secret
            }),
            shardsPerWorker: options.shardsPerWorker,
            token: options.token
        });

        super([
            connectionToService(messages, 'rabbitmq'),
            manager
        ]);
    }
}

export interface DiscordGatewayApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly managerId: string;
    readonly rest: {
        readonly secret: string;
        readonly url: string;
    };
    readonly token: string;
    readonly shardsPerWorker: number;
}
