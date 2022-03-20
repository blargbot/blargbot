import { BaseGuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, guard, humanize, parse } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/core/types';

export class MassBanCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'massban',
            aliases: ['hackban'],
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the ban.' }
            ],
            definitions: [
                {
                    parameters: '{userIds[]} {deleteDays:integer=1}',
                    description: 'Bans a user who isn\'t currently on your guild, where `<userIds...>` is a list of user IDs ' +
                        'or mentions (separated by spaces) and `days` is the number of days to delete messages for.\n' +
                        'If mod-logging is enabled, the ban will be logged.',
                    execute: (ctx, [users, deleteDays], flags) => this.massBan(ctx, users.asStrings, deleteDays.asInteger, flags)
                }
            ]
        });
    }

    public async massBan(context: GuildCommandContext, userIds: readonly string[], deleteDays: number, flags: FlagResult): Promise<string> {
        userIds = userIds.flatMap(u => parse.entityId(u)).filter(guard.hasValue);

        const reason = flags.r?.merge().value ?? '';

        const result = await context.cluster.moderation.bans.massBan(context.channel.guild, userIds, context.author, true, deleteDays, reason);
        if (Array.isArray(result))
            return this.error(`The following user(s) have been banned:${result.map(humanize.fullName).map(u => `\n**${u}**`).join('')}`);

        switch (result) {
            case 'alreadyBanned': return this.error('All those users are already banned!');
            case 'memberTooHigh': return this.error('I don\'t have permission to ban any of those users! Their highest roles are above my highest role.');
            case 'moderatorTooLow': return this.error('You don\'t have permission to ban any of those users! Their highest roles are above your highest role.');
            case 'noPerms': return this.error('I don\'t have permission to ban anyone! Make sure I have the `ban members` permission and try again.');
            case 'moderatorNoPerms': return this.error('You don\'t have permission to ban anyone! Make sure you have the `ban members` permission or one of the permissions specified in the `ban override` setting and try again.');
            case 'noUsers': return this.error('None of the user ids you gave were valid users!');
        }
    }
}
