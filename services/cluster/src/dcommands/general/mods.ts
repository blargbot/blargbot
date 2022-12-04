import type { CommandResult, GuildCommandContext } from '@blargbot/cluster/types.js';
import { CommandType } from '@blargbot/cluster/utils/index.js';
import type * as Eris from 'eris';

import { GuildCommand } from '../../command/index.js';
import templates from '../../text.js';

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

    public async listMods(context: GuildCommandContext, filter: (status: Eris.UserStatus) => boolean): Promise<CommandResult> {
        const byStatus = {
            online: { key: 'online', users: [] as Eris.User[] },
            idle: { key: 'away', users: [] as Eris.User[] },
            dnd: { key: 'busy', users: [] as Eris.User[] },
            offline: { key: 'offline', users: [] as Eris.User[] }
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
