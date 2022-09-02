import { CommandContext, GlobalCommand } from '@blargbot/cluster/command';
import { CommandType, guard, humanize } from '@blargbot/cluster/utils';
import { User } from 'eris';

export class DecancerCommand extends GlobalCommand {
    public constructor() {
        super({
            name: 'decancer',
            category: CommandType.GENERAL,
            definitions: [
                {
                    parameters: 'user {user:user+}',
                    description: 'Decancers a users display name. If you have permissions, this will also change their nickname',
                    execute: (ctx, [user]) => this.decancerUser(ctx, user.asUser)
                },
                {
                    parameters: '{text+}',
                    description: 'Decancers some text to plain ASCII',
                    execute: (_, [text]) => this.decancerText(text.asString)
                }
            ]
        });
    }

    public async decancerUser(context: CommandContext, user: User): Promise<string> {
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
            return this.success(`Successfully decancered **${member.mention}**'s name to: \`${decancered}\``);
        } catch {
            return this.decancerText(member.nick ?? member.username, decancered);
        }
    }

    public decancerText(text: string, decancered?: string): string {
        decancered ??= humanize.decancer(text);
        return this.success(`The decancered version of **${text}** is: \`${decancered}\``);
    }

}
