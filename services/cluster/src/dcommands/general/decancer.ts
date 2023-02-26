import { CommandType, guard } from '@blargbot/cluster/utils/index.js';
import { decancer } from '@blargbot/decancer';
import type * as Eris from 'eris';

import type { CommandContext } from '../../command/index.js';
import { GlobalCommand } from '../../command/index.js';
import templates from '../../text.js';
import type { CommandResult } from '../../types.js';

const cmd = templates.commands.decancer;

export class DecancerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'decancer',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: 'user {user:user+}',
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.decancerUser(ctx, user.asUser)
                },
                {
                    parameters: '{text+}',
                    description: cmd.text.description,
                    execute: (_, [text]) => this.decancerText(text.asString)
                }
            ]
        });
    }

    public async decancerUser(context: CommandContext, user: Eris.User): Promise<CommandResult> {
        if (!guard.isGuildCommandContext(context))
            return this.decancerText(user.username);

        const member = await context.util.getMember(context.channel.guild, user.id);
        if (member === undefined)
            return this.decancerText(user.username);

        if (!await context.util.isUserStaff(context.message.member))
            return this.decancerText(member.nick ?? member.username);

        const decancered = decancer(member.nick ?? member.username);
        try {
            await member.edit({ nick: decancered });
            member.nick = decancered;
            return cmd.user.success({ user, result: decancered });
        } catch {
            return this.decancerText(member.nick ?? member.username, decancered);
        }
    }

    public decancerText(text: string, decancered?: string): CommandResult {
        decancered ??= decancer(text);
        return cmd.text.success({ text, result: decancered });
    }

}
