import { GuildCommand } from '@blargbot/cluster/command';
import { CommandResult, GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, guard, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';

import templates from '../../text';

const cmd = templates.commands.massBan;

export class MassBanCommand extends GuildCommand {
    public constructor() {
        super({
            name: `massban`,
            aliases: [`hackban`],
            category: CommandType.ADMIN,
            flags: [
                { flag: `r`, word: `reason`, description: cmd.flags.reason }
            ],
            definitions: [
                {
                    parameters: `{userIds[]} {deleteDays:integer=1}`,
                    description: cmd.default.description,
                    execute: (ctx, [users, deleteDays], flags) => this.massBan(ctx, users.asStrings, deleteDays.asInteger, flags)
                }
            ]
        });
    }

    public async massBan(context: GuildCommandContext, userIds: readonly string[], deleteDays: number, flags: FlagResult): Promise<CommandResult> {
        userIds = userIds.flatMap(u => parse.entityId(u)).filter(guard.hasValue);

        const reason = flags.r?.merge().value ?? ``;

        const result = await context.cluster.moderation.bans.massBan(context.channel.guild, userIds, context.author, context.author, deleteDays, reason);
        if (Array.isArray(result))
            return `❌ The following user(s) have been banned:${result.map(humanize.fullName).map(u => `\n**${u}**`).join(``)}`;

        switch (result) {
            case `alreadyBanned`: return `❌ All those users are already banned!`;
            case `memberTooHigh`: return `❌ I don't have permission to ban any of those users! Their highest roles are above my highest role.`;
            case `moderatorTooLow`: return `❌ You don't have permission to ban any of those users! Their highest roles are above your highest role.`;
            case `noPerms`: return `❌ I don't have permission to ban anyone! Make sure I have the \`ban members\` permission and try again.`;
            case `moderatorNoPerms`: return `❌ You don't have permission to ban anyone! Make sure you have the \`ban members\` permission or one of the permissions specified in the \`ban override\` setting and try again.`;
            case `noUsers`: return `❌ None of the user ids you gave were valid users!`;
        }
    }
}
