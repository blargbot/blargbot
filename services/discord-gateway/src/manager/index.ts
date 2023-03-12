import { randomUUID } from 'node:crypto';

import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

import { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';
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
        const serviceName = 'discord-gateway-manager';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: fullContainerId });
        const manager = createDiscordGatewayManager({
            ipc: new DiscordGatewayIPCMessageBroker(messages, { managerId: options.managerId }),
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
            metrics,
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
