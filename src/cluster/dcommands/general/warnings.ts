import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, pluralise as p } from '@blargbot/cluster/utils';
import { Member } from 'eris';

export class WarningsCommand extends GuildCommand {
    public constructor() {
        super({
            name: `warnings`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: `Gets how many warnings you have`,
                    execute: (ctx) => this.warnings(ctx, ctx.message.member)
                },
                {
                    parameters: `{user:member+}`,
                    description: `Gets how many warnings the user has`,
                    execute: (ctx, [user]) => this.warnings(ctx, user.asMember)
                }
            ]
        });
    }

    public async warnings(context: GuildCommandContext, member: Member): Promise<string> {
        const { count, banAt, kickAt, timeoutAt } = await context.cluster.moderation.warns.details(member);
        const result: string[] = [
            count > 0
                ? this.warning(`**${humanize.fullName(member.user)}** has accumulated ${count} ${p(count, `warning`)}.`)
                : this.congrats(`**${humanize.fullName(member.user)}** doesn't have any warnings!`)
        ];

        if (timeoutAt !== undefined)
            result.push(`- ${timeoutAt - count} more warnings before being timed out.`);

        if (kickAt !== undefined)
            result.push(`- ${kickAt - count} more warnings before being kicked.`);

        if (banAt !== undefined)
            result.push(`- ${banAt - count} more warnings before being banned.`);

        return result.join(`\n`);
    }
}
