import type { IKVCache } from '@blargbot/redis-cache';

import type { IGuildEventLogDatabase } from './IGuildEventLogDatabase.js';

export class GuildEventLog {
    readonly #database: IGuildEventLogDatabase;
    readonly #cache: IKVCache<{ guildId: bigint; event: string; }, bigint | null>;

    public constructor(database: IGuildEventLogDatabase, cache: IKVCache<{ guildId: bigint; event: string; }, bigint | null>) {
        this.#database = database;
        this.#cache = cache;
    }

    public async getEventLogChannel(guildId: bigint, event: string): Promise<bigint | null> {
        return await this.#cache.getOrAdd({ guildId, event }, x => this.#database.get(x.guildId, x.event));
    }

    public async getAllEventLogChannels(guildId: bigint): Promise<Record<string, bigint>> {
        return await this.#database.list(guildId);
    }

    public async setEventLogChannel(guildId: bigint, event: string, channelId: bigint): Promise<void> {
        await this.#database.set(guildId, event, channelId);
        await this.#cache.delete({ guildId, event });
    }

    public async deleteEventLogChannel(guildId: bigint, event: string): Promise<void> {
        await this.#database.clear(guildId, event);
        await this.#cache.delete({ guildId, event });
    }

    public async clearEventLogChannels(guildId: bigint): Promise<void> {
        const events = await this.#database.clear(guildId);
        await Promise.all(events.map(event => this.#cache.delete({ guildId, event })));
    }
}
