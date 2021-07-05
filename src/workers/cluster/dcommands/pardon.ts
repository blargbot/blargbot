import { BaseGuildCommand, commandTypes, FlagResult, GuildCommandContext, humanize, parse } from '../core';

export class PardonCommand extends BaseGuildCommand {
    public constructor() {
        super({
            name: 'pardon',
            category: commandTypes.ADMIN,
            flags: [
                { flag: 'r', word: 'reason', desc: 'The reason for the pardon.' },
                {
                    flag: 'c',
                    word: 'count',
                    desc: 'The number of warnings that will be removed.'
                }
            ],
            definition: {
                parameters: '{user}',
                description: 'Pardons a user.\n' +
                    'If mod-logging is enabled, the pardon will be logged.\n' +
                    'This will not unban users.',
                execute: (ctx, [user], flags) => this.pardon(ctx, user, flags)
            }
        });
    }

    public async pardon(context: GuildCommandContext, user: string, flags: FlagResult): Promise<string> {
        const member = await context.util.getMember(context.message, user);
        if (member === undefined)
            return '❌ I couldn\'t find that user!';

        const reason = flags.r?.join(' ');
        const count = parse.int(flags.c?.join(' ') ?? 1);

        const result = await context.cluster.moderation.warns.pardon(member, context.author, count, reason);
        switch (result) {
            case 'countNaN': return `❌ ${flags.c?.join(' ') ?? ''} isnt a number!`;
            case 'countNegative': return '❌ I cant give a negative amount of pardons!';
            case 'countZero': return '❌ I cant give zero pardons!';
            default: return `✅ **${humanize.fullName(member)}** has been given ${count === 1 ? 'a pardon' : `${count} pardons`}. They now have ${result} warnings.`;
        }
    }
}
