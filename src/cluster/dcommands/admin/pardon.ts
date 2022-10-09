import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse, pluralise as p } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';

import templates from '../../text';

const cmd = templates.commands.pardon;

export class PardonCommand extends GuildCommand {
    public constructor() {
        super({
            name: `pardon`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: cmd.flags.reason },
                { flag: `c`, word: `count`, description: cmd.flags.count }
            ],
            definitions: [
                {
                    parameters: `{user:member+}`,
                    description: cmd.default.description,
                    execute: (ctx, [user], flags) => this.pardon(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async pardon(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<CommandResult> {
        const reason = flags.r?.merge().value;
        const count = parse.int(flags.c?.merge().value ?? 1, { strict: true }) ?? NaN;

        const result = await context.cluster.moderation.warns.pardon(member, context.author, count, reason);
        switch (result.state) {
            case `countNaN`: return `❌ ${flags.c?.merge().value ?? ``} isnt a number!`;
            case `countNegative`: return `❌ I cant give a negative amount of pardons!`;
            case `countZero`: return `❌ I cant give zero pardons!`;
            case `success`: return `✅ **${humanize.fullName(member.user)}** has been given ${p(count, `a pardon`, `${count} pardons`)}. They now have ${result.warnings} warnings.`;
        }
    }
}
