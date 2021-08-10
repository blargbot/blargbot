import { BaseGuildCommand } from '@cluster/command';
import { FlagResult, GuildCommandContext } from '@cluster/types';
import { CommandType, humanize, parse } from '@cluster/utils';

export class PardonCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'pardon',
            category: CommandType.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', description: 'The reason for the pardon.' },
                {
                    flag: 'c',
                    word: 'count',
                    description: 'The number of warnings that will be removed.'
                }
            ],
            definitions: [
                {
                    parameters: '{user+}',
                    description: 'Pardons a user.\n' +
                        'If mod-logging is enabled, the pardon will be logged.\n' +
                        'This will not unban users.',
                    execute: (ctx, [user], flags) => this.pardon(ctx, user, flags)
                }
            ]
        });
    }

    public async pardon(context: GuildCommandContext, user: string, flags: FlagResult): Promise<string> {
        const member = await context.util.getMember(context.message, user);
        if (member === undefined)
            return this.error('I couldn\'t find that user!');

        const reason = flags.r?.merge().value;
        const count = parse.int(flags.c?.merge().value ?? 1);

        const result = await context.cluster.moderation.warns.pardon(member, context.author, count, reason);
        switch (result) {
            case 'countNaN': return this.error(`${flags.c?.merge().value ?? ''} isnt a number!`);
            case 'countNegative': return this.error('I cant give a negative amount of pardons!');
            case 'countZero': return this.error('I cant give zero pardons!');
            default: return this.success(`**${humanize.fullName(member.user)}** has been given ${count === 1 ? 'a pardon' : `${count} pardons`}. They now have ${result} warnings.`);
        }
    }
}
