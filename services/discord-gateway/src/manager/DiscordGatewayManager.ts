import type { MessageHandle } from '@blargbot/message-broker';
import * as discordeno from 'discordeno';

import type { GatewayMessageBroker } from '../GatewayMessageBroker.js';
import { GatewayWorkerManager } from './GatewayWorkerManager.js';

export interface DiscordGatewayManager {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface DiscordGatewayManagerOptions {
    readonly gatewayBot: discordeno.GetGatewayBot;
    readonly messages: GatewayMessageBroker;
    readonly token: string;
    readonly shardsPerWorker: number;
}

export function createDiscordGatewayManager(options: DiscordGatewayManagerOptions): DiscordGatewayManager {
    const workers = new GatewayWorkerManager(options.messages);
    const manager = createGatewayManager(options, workers);
    let requestIdentify: MessageHandle | undefined;

    return {
        async start() {
            manager.prepareBuckets();
            requestIdentify ??= await options.messages.handleManagerCommand('requestIdentify', async ({ shardId, workerId }) => {
                await manager.manager.requestIdentify(shardId);
                await options.messages.sendWorkerCommand('allowIdentify', workerId, { shardId });
            });
            await Promise.all(manager.buckets.map(async (bucket, bucketId) => {
                for (const worker of bucket.workers) {
                    for (const shardId of worker.queue) {
                        await manager.tellWorkerToIdentify(worker.id, shardId, bucketId);
                    }
                }
            }));
        },
        async stop() {
            await Promise.all([...workers.list()].flatMap(w => [
                requestIdentify?.disconnect().finally(() => requestIdentify = undefined),
                w.shutdown()
            ]));
        }
    };
}

function createGatewayManager(options: DiscordGatewayManagerOptions, workers: GatewayWorkerManager): discordeno.GatewayManager {
    return discordeno.createGatewayManager({
        gatewayBot: options.gatewayBot,
        gatewayConfig: {
            token: options.token
        },
        shardsPerWorker: options.shardsPerWorker,
        handleDiscordPayload: () => { /* NO-OP */ },
        tellWorkerToIdentify: (manager, workerId, shardId) => workers
            .getOrCreateWorker(workerId, manager.lastShardId)
            .send('identifyShard', { shardId })
    });
}
