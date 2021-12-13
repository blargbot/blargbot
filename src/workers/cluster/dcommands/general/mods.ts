import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType } from '@cluster/utils';
import { EmbedField, EmbedOptions, Member, Status } from 'eris';

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
                    execute: (ctx) => this.listMods(ctx, p => p === 'offline')
                }
            ]
        });
    }

    public async listMods(context: GuildCommandContext, filter: (status: Status) => boolean): Promise<EmbedOptions> {
        const byStatus: { [P in Status]: Member[] } = {
            online: [],
            idle: [],
            dnd: [],
            offline: []
        };

        const isUserStaff = await context.util.isUserStaff(context.channel.guild);

        for (const member of context.channel.guild.members.values()) {
            if (member.user.bot || !isUserStaff(member) || !filter(member.status ?? 'offline'))
                continue;

            byStatus[member.status ?? 'offline'].push(member);
        }

        const fields: EmbedField[] = [];
        if (byStatus.online.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.online}> Online`, value: byStatus.online.join('\n'), inline: true });
        if (byStatus.idle.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.away}> Away`, value: byStatus.idle.join('\n'), inline: true });
        if (byStatus.dnd.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.busy}> Do not disturb`, value: byStatus.dnd.join('\n'), inline: true });
        if (byStatus.offline.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.offline}> Offline`, value: byStatus.offline.join('\n'), inline: true });

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: 'Moderators',
            description: fields.length > 0 ? undefined : 'There are no mods with that status!',
            fields
        };
    }
}
