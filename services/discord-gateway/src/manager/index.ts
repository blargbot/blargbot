import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import containerId, { fullContainerId } from '@blargbot/container-id';
import discordeno from '@blargbot/discordeno';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';
import { createDiscordGatewayManager } from './DiscordGatewayManager.js';

export class DiscordGatewayApplication extends ServiceHost {
    public constructor(options: DiscordGatewayApplicationOptions) {
        const serviceName = 'discord-gateway-manager';
        const hub = new MessageHub(options.messages);
        const manager = createDiscordGatewayManager({
            ipc: new DiscordGatewayIPCMessageBroker(hub, { managerId: options.managerId }),
            client: discordeno.useRestErrors(discordeno.createProxiedBot(options.discord)),
            shardsPerWorker: options.shardsPerWorker
        });

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: fullContainerId })
            ),
            manager
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordGatewayApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            username: env.rabbitUsername,
            password: env.rabbitPassword
        },
        managerId: containerId,
        discord: {
            token: env.discordToken,
            rest: {
                customUrl: env.discordProxyUrl,
                secretKey: env.discordProxySecret
            }
        },
        shardsPerWorker: env.shardsPerWorker

    }));
}

export interface DiscordGatewayApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly managerId: string;
    readonly discord: discordeno.CreateProxiedBotOptions;
    readonly shardsPerWorker: number;
}
