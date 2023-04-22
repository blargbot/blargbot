import type { DiscordGatewayMessageBroker } from '@blargbot/discord-gateway-client';
import type Discord from '@blargbot/discord-types';
import discordeno from '@blargbot/discordeno';
import type { MessageHandle } from '@blargbot/message-hub';

import type { DiscordGatewayIPCMessageBroker } from '../DiscordGatewayIPCMessageBroker.js';

export interface DiscordShardManager {
    start(): Promise<void>;
    stop(): Promise<void>;
}

export interface DiscordShardManagerOptions {
    readonly token: string;
    readonly lastShardId: number;
    readonly ipc: DiscordGatewayIPCMessageBroker;
    readonly gateway: DiscordGatewayMessageBroker;
    readonly workerId: number;
}

export function createDiscordShardManager(options: DiscordShardManagerOptions): DiscordShardManager {
    const { gateway, ipc, lastShardId, workerId, token } = options;
    const identifyPromises = new Map<number, () => void>();
    let allowIdentify: MessageHandle | undefined;
    let identifyShard: MessageHandle | undefined;
    const gatewayRequests: MessageHandle[] = [];

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
            token: token
        },
        shardIds: [],
        totalShards: lastShardId + 1,
        async handleMessage(shard, message) {
            await gateway.pushMessage(shard.id, lastShardId, message as Discord.GatewayReceivePayload);
        },
        async requestIdentify(shardId) {
            const waiter = new Promise<void>(res => identifyPromises.set(shardId, res));
            await ipc.sendManagerCommand('requestIdentify', { workerId: workerId, shardId });
            console.info('Shard identify requested', shardId);
            await waiter;
            console.info('Identifying shard', shardId);
        }
    });

    return {
        async start() {
            await Promise.all([
                ipc.handleWorkerCommand('identifyShard', workerId, async ({ shardId }) => {
                    await manager.identify(shardId);
                    gatewayRequests.push(await gateway.handleSend(
                        (...[, , payload]) => manager.shards.get(shardId)?.send(payload as unknown as discordeno.ShardSocketRequest),
                        {
                            shard: [shardId, lastShardId]
                        }
                    ));
                }).then(v => identifyShard = v),
                ipc.handleWorkerCommand('allowIdentify', workerId, ({ shardId }) => {
                    identifyPromises.get(shardId)?.();
                    identifyPromises.delete(shardId);
                }).then(v => allowIdentify = v)
            ]);
        },
        async stop() {
            await Promise.all([
                ...gatewayRequests.splice(0, Infinity).map(r => r.disconnect()),
                identifyShard?.disconnect().finally(() => identifyShard = undefined),
                allowIdentify?.disconnect().finally(() => allowIdentify = undefined),
                ...manager.shards.map(s => s.shutdown())
            ]);
        }
    };
}
