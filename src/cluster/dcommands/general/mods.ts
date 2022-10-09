import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { EmbedField, Member, UserStatus } from 'eris';

import templates from '../../text';

const cmd = templates.commands.mods;

export class ModsCommand extends GuildCommand {
    public constructor() {
        super({
            name: `mods`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.all.description,
                    execute: (ctx) => this.listMods(ctx, () => true)
                },
                {
                    parameters: `online|o`,
                    description: cmd.online.description,
                    execute: (ctx) => this.listMods(ctx, p => p === `online`)
                },
                {
                    parameters: `away|a`,
                    description: cmd.away.description,
                    execute: (ctx) => this.listMods(ctx, p => p === `idle`)
                },
                {
                    parameters: `dnd|d`,
                    description: cmd.dnd.description,
                    execute: (ctx) => this.listMods(ctx, p => p === `dnd`)
                },
                {
                    parameters: `offline`,
                    description: cmd.offline.description,
                    execute: (ctx) => this.listMods(ctx, p => p === `offline`)
                }
            ]
        });
    }

    public async listMods(context: GuildCommandContext, filter: (status: UserStatus) => boolean): Promise<CommandResult> {
        const byStatus: { [P in UserStatus]: Member[] } = {
            online: [],
            idle: [],
            dnd: [],
            offline: []
        };

        const isUserStaff = await context.util.isUserStaff(context.channel.guild);

        await context.util.ensureMemberCache(context.channel.guild);
        for (const member of context.channel.guild.members.values()) {
            if (member.user.bot || !isUserStaff(member) || !filter(member.status ?? `offline`))
                continue;

            byStatus[member.status ?? `offline`].push(member);
        }

        const fields: EmbedField[] = [];
        if (byStatus.online.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.online}> Online`, value: byStatus.online.map(m => m.mention).join(`\n`), inline: true });
        if (byStatus.idle.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.away}> Away`, value: byStatus.idle.map(m => m.mention).join(`\n`), inline: true });
        if (byStatus.dnd.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.busy}> Do not disturb`, value: byStatus.dnd.map(m => m.mention).join(`\n`), inline: true });
        if (byStatus.offline.length > 0)
            fields.push({ name: `<${context.config.discord.emotes.offline}> Offline`, value: byStatus.offline.map(m => m.mention).join(`\n`), inline: true });

        return {
            author: context.util.embedifyAuthor(context.channel.guild),
            title: `Moderators`,
            description: fields.length > 0 ? undefined : `There are no mods with that status!`,
            fields
        };
    }
}
