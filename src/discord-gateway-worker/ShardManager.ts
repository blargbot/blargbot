import type { ClusterStats, DiscordGatewayEvent, DiscordGatewayRequest, IdentifyShardRequest, IdentifyShardResponse, PermitShardIdentifyRequest, PermitShardIdentifyResponse, SetPresenceRequest, SwitchShardsRequest } from '@blargbot/contracts';
import type { Logger } from '@blargbot/logger';
import { AsyncResetValue } from '@blargbot/util';
import type { ShardCreateOptions } from '@discordeno/gateway';
import { DiscordenoShard, ShardSocketCloseCodes, ShardState } from '@discordeno/gateway';
import type { DiscordGuild, DiscordGuildCreateExtra, DiscordReady, DiscordUnavailableGuild } from '@discordeno/types';
import { GatewayOpcodes } from '@discordeno/types';

export class ShardManager {
    readonly #id: string;
    readonly #logger: Logger;
    readonly #shards = new Map<`${number}/${number}`, DiscordShard>();
    readonly #gatewayEvent = new AsyncResetValue<(message: DiscordGatewayEvent) => Promise<void>>();
    readonly #permitIdentify = new AsyncResetValue<(message: PermitShardIdentifyRequest) => Promise<PermitShardIdentifyResponse>>();
    readonly #postStats = new AsyncResetValue<(message: ClusterStats) => Promise<void>>();
    #activeGroup?: string;

    public get id(): string {
        return this.#id;
    }

    public get activeGroup(): string | undefined {
        return this.#activeGroup;
    }

    public constructor(id: string, logger: Logger) {
        this.#id = id;
        this.#logger = logger;
    }

    public handleGatewayMessage(handler: (message: DiscordGatewayEvent) => Promise<void>, signal?: AbortSignal): void {
        this.#gatewayEvent.resolve(handler, signal);
    }

    public handlePermitIdentify(handler: (message: PermitShardIdentifyRequest) => Promise<PermitShardIdentifyResponse>, signal?: AbortSignal): void {
        this.#permitIdentify.resolve(handler, signal);
    }

    public handlePostStats(handler: (message: ClusterStats) => Promise<void>, signal?: AbortSignal): void {
        this.#postStats.resolve(handler, signal);
    }

    async #requestIdentify(message: PermitShardIdentifyRequest): Promise<void> {
        const permitIdentify = await this.#permitIdentify.getValue();
        this.#logger.shardi(`Waiting for permission to identify shard ${message.shardId}/${message.totalShards}`);
        const response = await permitIdentify(message);
        if (response.error !== undefined)
            throw new RejectShardIdentifyError(response.error);
        this.#logger.shardi(`Received permission to identify shard ${message.shardId}/${message.totalShards}`);
    }

    public async setPresence(message: SetPresenceRequest): Promise<void> {
        await Promise.allSettled(
            this.#shards.values().map(shard => shard.send({
                op: GatewayOpcodes.PresenceUpdate,
                d: message
            }))
        );
    }

    public async send(message: DiscordGatewayRequest): Promise<void> {
        const { shardId, totalShards, ...payload } = message;
        const shard = this.#shards.get(`${shardId}/${totalShards}`);
        await shard?.send(payload);
    }

    public async identify(message: IdentifyShardRequest): Promise<IdentifyShardResponse> {
        const key = `${message.shardId}/${message.totalShards}` as const;
        let shard = this.#shards.get(key);
        if (shard !== undefined) {
            shard.groupIds.add(message.groupId);
            this.#logger.shardi(`Shard ${message.shardId}/${message.totalShards} is now in group ${message.groupId}`);
            return {};
        }

        this.#logger.shardi(`Spawning & identifying new shard: ${key}`);
        this.#shards.set(key, shard = new DiscordShard(this, {
            id: message.shardId,
            emit: message => void this.#gatewayEvent.getValue().then(e => e(message)).catch(err => {
                this.#logger.warn('Failed to post gateway event to queue. Event will be dropped', err);
            }),
            requestIdentify: () => this.#requestIdentify({
                shardId: message.shardId,
                totalShards: message.totalShards
            }),
            connection: {
                totalShards: message.totalShards,
                intents: message.intents,
                token: message.token,
                url: message.url,
                version: message.version,
                compress: false,
                transportCompression: null,
                properties: {
                    os: process.platform,
                    browser: 'discordeno',
                    device: 'discordeno'
                }
            }
        }));
        shard.groupIds.add(message.groupId);
        this.#logger.shardi(`Shard ${message.shardId}/${message.totalShards} is now in group ${message.groupId}`);

        try {
            await shard.identify();
            this.#logger.shardi(`Shard ${key} has identified.`);
        } catch (error) {
            this.#logger.error(`Shard ${key} failed to identify.`, error);
            if (!(error instanceof RejectShardIdentifyError))
                throw error;
            this.#shards.delete(key);
            return { error: error.message };
        }

        return { error: undefined };
    }

    public switchShards(message: SwitchShardsRequest): void {
        this.#activeGroup = message.groupId;
        this.#logger.shardi(`Switched to a new shard generation: ${message.groupId}`);
    }

    public async pruneShards(): Promise<void> {
        this.#logger.shardi(`Pruning all shards not in the current generation (${this.#activeGroup ?? ''})`);
        const oldShards = [];
        for (const [key, shard] of this.#shards) {
            if (!shard.groupIds.has(this.#activeGroup)) {
                oldShards.push(shard);
                this.#shards.delete(key);
            } else if (shard.groupIds.size > 1) {
                shard.groupIds.clear();
                shard.groupIds.add(this.#activeGroup);
            }
        }

        this.#logger.shardi(`Found ${oldShards.length} shard(s) to prune:`, oldShards.map(s => `${s.id}/${s.connection.totalShards}`));
        await Promise.allSettled(oldShards.map(shard => shard.close(ShardSocketCloseCodes.Resharded, 'Shard is being resharded')));
    }

    public async postStats(): Promise<void> {
        const postStats = await this.#postStats.getValue();
        const shards: ClusterStats['shards'] = [];
        for (const shard of this.#shards.values()) {
            shards.push({
                shardId: shard.id,
                groupIds: [...shard.groupIds],
                totalShards: shard.connection.totalShards,
                state: shardStateMap[shard.state],
                interval: shard.heart.interval,
                lastAck: shard.heart.lastAck,
                lastBeat: shard.heart.lastBeat,
                latency: shard.heart.rtt,
                guilds: shard.guilds,
                unavailableGuilds: shard.unavailableGuilds
            });
        }
        await postStats({
            clusterId: this.#id,
            timestamp: Date.now(),
            activeGroupId: this.#activeGroup,
            shards
        });
        this.#logger.shardi('Posted cluster stats.');
    }
}

class RejectShardIdentifyError extends Error {
    public constructor(reason: string) {
        super(`Identify request was rejected: ${reason}`);
    }
}

const shardStateMap: { [P in Extract<keyof typeof ShardState, string> as typeof ShardState[P]]: P } = {
    [ShardState.Connected]: 'Connected',
    [ShardState.Connecting]: 'Connecting',
    [ShardState.Disconnected]: 'Disconnected',
    [ShardState.Unidentified]: 'Unidentified',
    [ShardState.Identifying]: 'Identifying',
    [ShardState.Resuming]: 'Resuming',
    [ShardState.Offline]: 'Offline'
};

export class DiscordShard extends DiscordenoShard {
    readonly #guildIds = new Set<string>();
    readonly #unavailableGuildIds = new Set<string>();
    public readonly groupIds = new Set<string>();

    // @ts-expect-error The first shard parameter is meant to be `this`, so the typing is correct here.
    declare public events: CustomShardEvents;

    public get guilds(): number {
        return this.#guildIds.size;
    }

    public get unavailableGuilds(): number {
        return this.#unavailableGuildIds.size;
    }

    public constructor(parent: ShardManager, options: Omit<ShardCreateOptions, 'events'> & { requestIdentify: () => Promise<void>; emit: (message: DiscordGatewayEvent) => void; }) {
        const { requestIdentify, emit, ...coreOptions } = options;
        const shardId = options.id;
        const totalShards = coreOptions.connection.totalShards;

        super({
            ...coreOptions,
            events: {
                message: (_, payload) => {
                    switch (payload.t) {
                        case 'GUILD_CREATE': {
                            const { id, unavailable = false } = payload.d as DiscordGuildCreateExtra & (DiscordUnavailableGuild | DiscordGuild);
                            this.#guildIds.add(id);
                            this.#unavailableGuildIds[unavailable ? 'add' : 'delete'](id);
                            break;
                        }
                        case 'GUILD_DELETE': {
                            const { id, unavailable = false } = payload.d as DiscordUnavailableGuild;
                            this.#guildIds[unavailable ? 'add' : 'delete'](id);
                            this.#unavailableGuildIds[unavailable ? 'add' : 'delete'](id);
                            break;
                        }
                        case 'GUILD_UPDATE': {
                            const { id } = payload.d as DiscordGuild;
                            this.#guildIds.add(id);
                            this.#unavailableGuildIds.delete(id);
                            break;
                        }
                        case 'READY': {
                            for (const { id, unavailable = false } of (payload.d as DiscordReady).guilds) {
                                this.#guildIds.add(id);
                                this.#unavailableGuildIds[unavailable ? 'add' : 'delete'](id);
                            }
                            break;
                        }

                        case 'GUILD_MEMBERS_CHUNK':
                        case 'SOUNDBOARD_SOUNDS':
                        case 'CHANNEL_INFO' as never:
                            emit({
                                ...payload,
                                shardId,
                                totalShards
                            });
                            return;
                    }

                    if (this.groupIds.has(parent.activeGroup)) {
                        emit({
                            ...payload,
                            shardId,
                            totalShards
                        });
                    }
                }
            }
        });
        this.requestIdentify = requestIdentify;
    }
}
