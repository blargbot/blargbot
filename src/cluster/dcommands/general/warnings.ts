import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, pluralise as p } from '@blargbot/cluster/utils';
import { Member } from 'eris';

import templates from '../../text';

const cmd = templates.commands.warnings;

export class WarningsCommand extends GuildCommand {
    public constructor() {
        super({
            name: `warnings`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: ``,
                    description: cmd.self.description,
                    execute: (ctx) => this.warnings(ctx, ctx.message.member)
                },
                {
                    parameters: `{user:member+}`,
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.warnings(ctx, user.asMember)
                }
            ]
        });
    }

    public async warnings(context: GuildCommandContext, member: Member): Promise<CommandResult> {
        const { count, banAt, kickAt, timeoutAt } = await context.cluster.moderation.warns.details(member);
        const result: string[] = [
            count > 0
                ? `⚠️ **${humanize.fullName(member.user)}** has accumulated ${count} ${p(count, `warning`)}.`
                : `🎉 **${humanize.fullName(member.user)}** doesn't have any warnings!`
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
