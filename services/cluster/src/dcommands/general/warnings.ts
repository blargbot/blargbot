import { GuildCommand } from '../../command/index';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType } from '@blargbot/cluster/utils';
import { IFormattable } from '@blargbot/formatting';
import Eris from 'eris';

import templates from '../../text';

const cmd = templates.commands.warnings;

export class WarningsCommand extends GuildCommand {
    public constructor() {
        super({
            name: 'warnings',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: '',
                    description: cmd.self.description,
                    execute: (ctx) => this.warnings(ctx, ctx.message.member)
                },
                {
                    parameters: '{user:member+}',
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.warnings(ctx, user.asMember)
                }
            ]
        });
    }

    public async warnings(context: GuildCommandContext, member: Eris.Member): Promise<CommandResult> {
        const { count, banAt, kickAt, timeoutAt } = await context.cluster.moderation.warns.details(member);
        const result: Array<IFormattable<string>> = [
            cmd.common.count({ user: member.user, count })
        ];

        if (timeoutAt !== undefined && timeoutAt > count)
            result.push(cmd.common.untilTimeout({ remaining: timeoutAt - count }));

        if (kickAt !== undefined && kickAt > count)
            result.push(cmd.common.untilKick({ remaining: kickAt - count }));

        if (banAt !== undefined && banAt > count)
            result.push(cmd.common.untilBan({ remaining: banAt - count }));

        return cmd.common.success({ parts: result });
    }
}
