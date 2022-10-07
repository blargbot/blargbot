import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';

export class UnbanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `unban`,
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: `The reason for the ban.` }
            ],
            definitions: [
                {
                    parameters: `{userId}`,
                    description: `Unbans a user.\nIf mod-logging is enabled, the ban will be logged.`,
                    execute: (ctx, [user], flags) => this.unban(ctx, user.asString, flags)
                }
            ]
        });
    }

    public async unban(context: GuildCommandContext, userId: string, flags: FlagResult): Promise<string> {
        const user = await context.util.getUser(userId);
        if (user === undefined)
            return `❌ I couldn't find that user!`;

        const reason = flags.r?.merge().value;

        switch (await context.cluster.moderation.bans.unban(context.channel.guild, user, context.author, context.author, reason)) {
            case `notBanned`: return `❌ **${humanize.fullName(user)}** is not currently banned!`;
            case `noPerms`: return `❌ I don't have permission to unban **${humanize.fullName(user)}**! Make sure I have the \`ban members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to unban **${humanize.fullName(user)}**! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`;
            case `success`: return `✅ **${humanize.fullName(user)}** has been unbanned.`;
        }
    }
}
