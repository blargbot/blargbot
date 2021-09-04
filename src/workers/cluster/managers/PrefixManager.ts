import { guard } from '@cluster/utils';
import { GuildTable, UserTable } from '@core/types';
import { Message } from 'discord.js';

export class PrefixManager {
    public constructor(
        private readonly defaultPrefix: string,
        private readonly guilds: GuildTable,
        private readonly users: UserTable
    ) {
    }

    public async getGuildPrefixes(guildId: string): Promise<readonly string[]> {
        return await this.guilds.getSetting(guildId, 'prefix') ?? [];
    }

    public async addGuildPrefix(guildId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getGuildPrefixes(guildId));
        if (prefixes.size === prefixes.add(prefix.toLowerCase()).size)
            return false;

        return await this.guilds.setSetting(guildId, 'prefix', [...prefixes]);
    }

    public async removeGuildPrefix(guildId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getGuildPrefixes(guildId));
        if (!prefixes.delete(prefix.toLowerCase()))
            return false;

        return await this.guilds.setSetting(guildId, 'prefix', [...prefixes]);
    }

    public async getUserPrefixes(userId: string): Promise<readonly string[]> {
        return await this.users.getSetting(userId, 'prefixes') ?? [];
    }

    public async addUserPrefix(userId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getUserPrefixes(userId));
        if (prefixes.size === prefixes.add(prefix.toLowerCase()).size)
            return false;

        return await this.users.setSetting(userId, 'prefixes', [...prefixes]);
    }

    public async removeUserPrefix(userId: string, prefix: string): Promise<boolean> {
        const prefixes = new Set(await this.getUserPrefixes(userId));
        if (prefixes.delete(prefix.toLowerCase()))
            return false;

        return await this.users.setSetting(userId, 'prefixes', [...prefixes]);
    }

    public async findPrefix(message: Message): Promise<string | undefined> {
        const prefixes = [
            this.defaultPrefix,
            ...await this.getUserPrefixes(message.author.id)
        ];

        if (message.client.isReady())
            prefixes.push(`<@${message.client.user.id}>`, `<@!${message.client.user.id}>`);

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
