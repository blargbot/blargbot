import { BaseGuildCommand } from '@cluster/command';
import { GuildCommandContext } from '@cluster/types';
import { CommandType, humanize } from '@cluster/utils';
import { GuildMember } from 'discord.js';

export class WarningsCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'warnings',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: 'Gets how many warnings you have',
                    execute: (ctx) => this.warnings(ctx, ctx.message.member)
                },
                {
                    parameters: '{user+}',
                    description: 'Gets how many warnings the user has',
                    execute: (ctx, [user]) => this.warnings(ctx, user)
                }
            ]
        });
    }

    public async warnings(context: GuildCommandContext, member: string | GuildMember): Promise<string> {
        if (typeof member === 'string') {
            const result = await context.util.queryMember(context.channel, context.author, context.channel.guild, member);
            if (typeof result === 'string')
                return this.error(`I couldnt find the user ${member}!`);
            member = result;
        }

        const { count, banAt, kickAt } = await context.cluster.moderation.warns.details(member);
        const result = [
            count > 0
                ? this.warning(`**${humanize.fullName(member.user)}** has accumulated ${count === 1 ? '1 warning' : `${count} warnings`}.`)
                : this.congrats(`**${humanize.fullName(member.user)}** doesn't have any warnings!`)
        ];

        if (kickAt !== undefined)
            result.push(`- ${kickAt - count} more warnings before being kicked.`);

        if (banAt !== undefined)
            result.push(`- ${banAt - count} more warnings before being banned.`);

        return result.join('\n');
    }
}
