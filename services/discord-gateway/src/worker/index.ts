import { fileURLToPath } from 'node:url';

import { connectToService, host, isEntrypoint, parallelServices, ServiceHost } from '@blargbot/application';
import containerId, { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsPushService } from '@blargbot/metrics-client';

import { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';
import { createDiscordShardManager } from './DiscordShardManager.js';

export const workerPath = fileURLToPath(import.meta.url);

export class DiscordGatewayWorkerApplication extends ServiceHost {
    public constructor(options: DiscordGatewayWorkerApplicationOptions) {
        const serviceName = 'discord-gateway-worker';
        const hub = new MessageHub(options.messages);
        const manager = createDiscordShardManager({
            ipc: new DiscordGatewayIPCMessageBroker(hub, { managerId: options.managerId }),
            gateway: new DiscordGatewayMessageBroker(hub, 'discord-gateway'),
            lastShardId: options.lastShardId,
            token: options.token,
            workerId: options.workerId
        });

        super([
            parallelServices(
                connectToService(hub, 'rabbitmq'),
                new MetricsPushService({ serviceName, instanceId: `${fullContainerId}(${options.workerId})` })
            ),
            manager,
            {
                start() {
                    process.send?.('started');
                },
                stop() {
                    process.send?.('stopped');
                }
            }
        ]);
    }
}

if (isEntrypoint()) {
    host(new DiscordGatewayWorkerApplication({
        messages: {
            prefetch: env.rabbitPrefetch,
            hostname: env.rabbitHost,
            password: env.rabbitPassword,
            username: env.rabbitUsername
        },
        managerId: containerId,
        lastShardId: env.get(Number, 'LAST_SHARD_ID'),
        workerId: env.get(Number, 'WORKER_ID'),
        token: env.discordToken

    }));
}

interface DiscordGatewayWorkerApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly managerId: string;
    readonly lastShardId: number;
    readonly workerId: number;
    readonly token: string;
}
