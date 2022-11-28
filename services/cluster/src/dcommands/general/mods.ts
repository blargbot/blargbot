import { GuildCommand } from '../../command/index';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { User, UserStatus } from 'eris';

import templates from '../../text';

const cmd = templates.commands.mods;

export class ModsCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'mods',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.all.description,
                    execute: (ctx) => this.listMods(ctx, () => true)
                },
                {
                    parameters: 'online|o',
                    description: cmd.online.description,
                    execute: (ctx) => this.listMods(ctx, p => p === 'online')
                },
                {
                    parameters: 'away|a',
                    description: cmd.away.description,
                    execute: (ctx) => this.listMods(ctx, p => p === 'idle')
                },
                {
                    parameters: 'busy|b',
                    description: cmd.busy.description,
                    execute: (ctx) => this.listMods(ctx, p => p === 'dnd')
                },
                {
                    parameters: 'offline',
                    description: cmd.offline.description,
                    execute: (ctx) => this.listMods(ctx, p => p === 'offline')
                }
            ]
        });
    }

    public async listMods(context: GuildCommandContext, filter: (status: UserStatus) => boolean): Promise<CommandResult> {
        const byStatus = {
            online: { key: 'online', users: [] as User[] },
            idle: { key: 'away', users: [] as User[] },
            dnd: { key: 'busy', users: [] as User[] },
            offline: { key: 'offline', users: [] as User[] }
        } as const;

        const isUserStaff = await context.util.isUserStaff(context.channel.guild);

        await context.util.ensureMemberCache(context.channel.guild);
        for (const member of context.channel.guild.members.values()) {
            if (member.user.bot || !isUserStaff(member) || !filter(member.status ?? 'offline'))
                continue;

            byStatus[member.status ?? 'offline'].users.push(member.user);
        }

        const fields = Object.values(byStatus)
            .filter(x => x.users.length > 0)
            .map(({ users, key }) => ({
                name: cmd.common.embed.field[key].name({ emote: `<${context.cluster.config.discord.emotes[key]}>` }),
                value: cmd.common.embed.field[key].value({ users }),
                inline: true
            }));

        return {
            embeds: [
                {
                    author: context.util.embedifyAuthor(context.channel.guild),
                    title: cmd.common.embed.title,
                    description: fields.length === 0 ? cmd.common.embed.description.none : undefined,
                    fields
                }
            ]
        };
    }
}
