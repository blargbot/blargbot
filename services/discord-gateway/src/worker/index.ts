import { fileURLToPath } from 'node:url';

import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import containerId, { fullContainerId } from '@blargbot/container-id';
import { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

import { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';
import { createDiscordShardManager } from './DiscordShardManager.js';

export const workerPath = fileURLToPath(import.meta.url);

@hostIfEntrypoint(() => [{
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
}])
export class DiscordGatewayWorkerApplication extends ServiceHost {
    public constructor(options: DiscordGatewayWorkerApplicationOptions) {
        const serviceName = 'discord-gateway-worker';
        const messages = new MessageHub(options.messages);
        const metrics = new MetricsClient({ serviceName, instanceId: `${fullContainerId}(${options.workerId})` });
        const manager = createDiscordShardManager({
            ipc: new DiscordGatewayIPCMessageBroker(messages, { managerId: options.managerId }),
            gateway: new DiscordGatewayMessageBroker(messages, 'discord-gateway'),
            lastShardId: options.lastShardId,
            token: options.token,
            workerId: options.workerId
        });

        super([
            connectionToService(messages, 'rabbitmq'),
            metrics,
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

interface DiscordGatewayWorkerApplicationOptions {
    readonly messages: ConnectionOptions;
    readonly managerId: string;
    readonly lastShardId: number;
    readonly workerId: number;
    readonly token: string;
}
