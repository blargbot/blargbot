import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { EmbedFieldData, GuildMember, MessageEmbedOptions, PresenceStatus } from 'discord.js';

export class ModsCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'mods',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets a list of all mods.',
                    execute: (ctx) => this.listMods(ctx, () => true)
                },
                {
                    parameters: 'online|o',
                    description: 'Gets a list of all currently online mods.',
                    execute: (ctx) => this.listMods(ctx, p => p === 'online')
                },
                {
                    parameters: 'away|a',
                    description: 'Gets a list of all currently away mods.',
                    execute: (ctx) => this.listMods(ctx, p => p === 'idle')
                },
                {
                    parameters: 'dnd|d',
                    description: 'Gets a list of all mods currently set to do not disturb.',
                    execute: (ctx) => this.listMods(ctx, p => p === 'dnd')
                },
                {
                    parameters: 'offline',
                    description: 'Gets a list of all currently offline mods.',
                    execute: (ctx) => this.listMods(ctx, p => p === 'offline' || p === 'invisible')
                }
            ]
        });
    }

    public async listMods(context: GuildCommandContext, filter: (status: PresenceStatus) => boolean): Promise<MessageEmbedOptions> {
        const byStatus: { [P in PresenceStatus]: GuildMember[] } = {
            online: [],
            idle: [],
            dnd: [],
            offline: [],
            invisible: []
        };

        const isUserStaff = await context.util.isUserStaff(context.channel.guild);

        for (const member of context.channel.guild.members.cache.values()) {
            if (member.user.bot || !isUserStaff(member) || !filter(member.presence?.status ?? 'offline'))
                continue;

            byStatus[member.presence?.status ?? 'offline'].push(member);
        }

        const fields: EmbedFieldData[] = [];
        if (byStatus.online.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.online}> Online`, value: byStatus.online.join('\n'), inline: true });
        if (byStatus.idle.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.away}> Away`, value: byStatus.idle.join('\n'), inline: true });
        if (byStatus.dnd.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.busy}> Do not disturb`, value: byStatus.dnd.join('\n'), inline: true });
        if (byStatus.offline.length > 0 || byStatus.invisible.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.offline}> Offline`, value: [...byStatus.offline, ...byStatus.invisible].join('\n'), inline: true });

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: 'Moderators',
            description: fields.length > 0 ? undefined : 'There are no mods with that status!',
            fields
        };
    }
}
