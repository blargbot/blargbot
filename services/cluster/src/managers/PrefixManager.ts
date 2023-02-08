import { guard } from '@blargbot/cluster/utils/index.js';
import { markup } from '@blargbot/discord-util';
import type { GuildStore, UserStore } from '@blargbot/domain/stores/index.js';
import type * as Eris from 'eris';

export class PrefixManager {
    readonly #defaultPrefix: string;
    readonly #guilds: GuildStore;
    readonly #users: UserStore;
    readonly #discord: Eris.Client;

    public constructor(
        defaultPrefix: string,
        guilds: GuildStore,
        users: UserStore,
        discord: Eris.Client
    ) {
        this.#defaultPrefix = defaultPrefix;
        this.#guilds = guilds;
        this.#users = users;
        this.#discord = discord;
    }

    public async getGuildPrefixes(guildId: string): Promise<readonly string[]> {
        return await this.#guilds.getSetting(guildId, 'prefix') ?? [];
    }

    public async addGuildPrefix(guildId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getGuildPrefixes(guildId));
        if (prefixes.size === prefixes.add(prefix.toLowerCase()).size)
            return false;

        return await this.#guilds.setSetting(guildId, 'prefix', [...prefixes]);
    }

    public async removeGuildPrefix(guildId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getGuildPrefixes(guildId));
        if (!prefixes.delete(prefix.toLowerCase()))
            return false;

        return await this.#guilds.setSetting(guildId, 'prefix', [...prefixes]);
    }

    public async getUserPrefixes(userId: string): Promise<readonly string[]> {
        return await this.#users.getProp(userId, 'prefixes') ?? [];
    }

    public async addUserPrefix(userId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getUserPrefixes(userId));
        if (prefixes.size === prefixes.add(prefix.toLowerCase()).size)
            return false;

        return await this.#users.setProp(userId, 'prefixes', [...prefixes]);
    }

    public async removeUserPrefix(userId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getUserPrefixes(userId));
        if (prefixes.delete(prefix.toLowerCase()))
            return false;

        return await this.#users.setProp(userId, 'prefixes', [...prefixes]);
    }

    public async findPrefix(message: Eris.KnownMessage): Promise<string | undefined> {
        const prefixes = [
            this.#defaultPrefix,
            ...await this.getUserPrefixes(message.author.id),
            markup.user(this.#discord.user.id),
            markup.user.nickname(this.#discord.user.id)
        ];

        if (guard.isGuildMessage(message))
            prefixes.push(...await this.getGuildPrefixes(message.channel.guild.id));
        else
            prefixes.push('');

        const content = message.content.toLowerCase();
        return prefixes
            .sort((a, b) => b.length - a.length)
            .find(p => content.startsWith(p));
    }
}
