import type { MessageHandle } from '@blargbot/message-broker';
import * as discordeno from 'discordeno';

import type { GatewayMessageBroker } from '../GatewayMessageBroker.js';

export interface DiscordShardManager {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface DiscordShardManagerOptions {
    readonly token: string;
    readonly lastShardId: number;
    readonly messages: GatewayMessageBroker;
    readonly workerId: number;
}

export function createDiscordShardManager(options: DiscordShardManagerOptions): DiscordShardManager {
    const identifyPromises = new Map<number, () => void>();
    let allowIdentify: MessageHandle | undefined;
    let identifyShard: MessageHandle | undefined;
    const gatewayRequests = new Set<MessageHandle>();

    const manager = discordeno.createShardManager({
        gatewayConfig: {
            intents: discordeno.Intents.Guilds
                | discordeno.Intents.GuildMembers
                | discordeno.Intents.GuildBans
                | discordeno.Intents.GuildPresences
                | discordeno.Intents.GuildMessages
                | discordeno.Intents.MessageContent
                | discordeno.Intents.GuildMessageReactions
                | discordeno.Intents.GuildEmojis
                | discordeno.Intents.DirectMessages
                | discordeno.Intents.DirectMessageReactions,
            token: options.token
        },
        shardIds: [],
        totalShards: options.lastShardId + 1,
        async handleMessage(shard, message) {
            await options.messages.sendGatewayEvent(shard.id, options.lastShardId, message);
        },
        async requestIdentify(shardId) {
            const waiter = new Promise<void>(res => identifyPromises.set(shardId, res));
            await options.messages.sendManagerCommand('requestIdentify', { workerId: options.workerId, shardId });
            console.info('Shard identify requested', shardId);
            await waiter;
            console.info('Identifying shard', shardId);
        }
    });

    return {
        async start() {
            await Promise.all([
                options.messages.handleWorkerCommand('identifyShard', options.workerId, async ({ shardId }) => {
                    await manager.identify(shardId);
                    gatewayRequests.add(await options.messages.handleGatewayRequest(shardId, options.lastShardId, async msg => {
                        await manager.shards.get(shardId)?.send(msg);
                    }));
                }).then(v => identifyShard = v),
                options.messages.handleWorkerCommand('allowIdentify', options.workerId, ({ shardId }) => {
                    identifyPromises.get(shardId)?.();
                    identifyPromises.delete(shardId);
                }).then(v => allowIdentify = v)
            ]);
        },
        async stop() {
            await Promise.all([
                ...[...gatewayRequests].map(r => r.disconnect().finally(() => gatewayRequests.delete(r))),
                identifyShard?.disconnect().finally(() => identifyShard = undefined),
                allowIdentify?.disconnect().finally(() => allowIdentify = undefined),
                ...manager.shards.map(s => s.shutdown())
            ]);
        }
    };
}
