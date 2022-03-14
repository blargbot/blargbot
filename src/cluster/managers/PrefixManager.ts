import { guard } from '@blargbot/cluster/utils';
import { GuildTable, UserTable } from '@blargbot/core/types';
import { Client as Discord, KnownMessage } from 'eris';

export class PrefixManager {
    public constructor(
        private readonly defaultPrefix: string,
        private readonly guilds: GuildTable,
        private readonly users: UserTable,
        private readonly discord: Discord
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

    public async findPrefix(message: KnownMessage): Promise<string | undefined> {
        const prefixes = [
            this.defaultPrefix,
            ...await this.getUserPrefixes(message.author.id)
        ];

        prefixes.push(`<@${this.discord.user.id}>`, `<@!${this.discord.user.id}>`);
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
