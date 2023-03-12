import type { MessageHandle } from '@blargbot/message-hub';
import * as discordeno from 'discordeno';

import type { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';
import { GatewayWorkerManager } from './GatewayWorkerManager.js';

export interface DiscordGatewayManager {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface DiscordGatewayManagerOptions {
    readonly client: discordeno.Bot;
    readonly ipc: DiscordGatewayIPCMessageBroker;
    readonly token: string;
    readonly shardsPerWorker: number;
}

export function createDiscordGatewayManager(options: DiscordGatewayManagerOptions): DiscordGatewayManager {
    const { ipc } = options;
    const workers = new GatewayWorkerManager(ipc);
    let requestIdentify: MessageHandle | undefined;

    return {
        async start() {
            const manager = await createGatewayManager(options, workers);
            manager.prepareBuckets();
            requestIdentify ??= await ipc.handleManagerCommand('requestIdentify', async ({ shardId, workerId }) => {
                await manager.manager.requestIdentify(shardId);
                await ipc.sendWorkerCommand('allowIdentify', workerId, { shardId });
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

async function createGatewayManager(options: DiscordGatewayManagerOptions, workers: GatewayWorkerManager): Promise<discordeno.GatewayManager> {
    const { client, token, shardsPerWorker } = options;
    return discordeno.createGatewayManager({
        gatewayBot: await client.helpers.getGatewayBot(),
        gatewayConfig: {
            token: token
        },
        shardsPerWorker: shardsPerWorker,
        handleDiscordPayload: () => { /* NO-OP */ },
        tellWorkerToIdentify: (manager, workerId, shardId) => workers
            .getOrCreateWorker(workerId, manager.lastShardId)
            .send('identifyShard', { shardId })
    });
}
