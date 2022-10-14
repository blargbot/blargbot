import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard, humanize } from '@blargbot/cluster/utils';
import { User } from 'eris';

import templates from '../../text';
import { CommandResult } from '../../types';

const cmd = templates.commands.decancer;

export class DecancerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: `decancer`,
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: `user {user:user+}`,
                    description: cmd.user.description,
                    execute: (ctx, [user]) => this.decancerUser(ctx, user.asUser)
                },
                {
                    parameters: `{text+}`,
                    description: cmd.text.description,
                    execute: (_, [text]) => this.decancerText(text.asString)
                }
            ]
        });
    }

    public async decancerUser(context: CommandContext, user: User): Promise<CommandResult> {
        if (!guard.isGuildCommandContext(context))
            return this.decancerText(user.username);

        const member = await context.util.getMember(context.channel.guild, user.id);
        if (member === undefined)
            return this.decancerText(user.username);

        if (!await context.util.isUserStaff(context.message.member))
            return this.decancerText(member.nick ?? member.username);

        const decancered = humanize.decancer(member.nick ?? member.username);
        try {
            await member.edit({ nick: decancered });
            member.nick = decancered;
            return cmd.user.success({ user, result: decancered });
        } catch {
            return this.decancerText(member.nick ?? member.username, decancered);
        }
    }

    public decancerText(text: string, decancered?: string): CommandResult {
        decancered ??= humanize.decancer(text);
        return cmd.text.success({ text, result: decancered });
    }

}
