import { fileURLToPath } from 'node:url';

import { connectionToService, hostIfEntrypoint, ServiceHost } from '@blargbot/application';
import { fullContainerId } from '@blargbot/container-id';
import env from '@blargbot/env';
import type { ConnectionOptions } from '@blargbot/message-hub';
import { MessageHub } from '@blargbot/message-hub';
import { MetricsClient } from '@blargbot/metrics-client';

import { GatewayMessageBroker } from '../GatewayMessageBroker.js';
import { createDiscordShardManager } from './DiscordShardManager.js';

export const workerPath = fileURLToPath(import.meta.url);

@hostIfEntrypoint(() => [{
    messages: {
        prefetch: env.rabbitPrefetch,
        hostname: env.rabbitHost,
        password: env.rabbitPassword,
        username: env.rabbitUsername
    },
    managerId: env.get(String, 'MANAGER_ID'),
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
            messages: new GatewayMessageBroker(messages, { managerId: options.managerId }),
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
