import { GuildCommand } from '@blargbot/cluster/command';
import { GuildCommandContext } from '@blargbot/cluster/types';
import { CommandType, humanize, parse, pluralise as p } from '@blargbot/cluster/utils';
import { FlagResult } from '@blargbot/domain/models';
import { Member } from 'eris';

export class PardonCommand extends GuildCommand {
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
                    parameters: '{user:member+}',
                    description: 'Pardons a user.\n' +
                        'If mod-logging is enabled, the pardon will be logged.\n' +
                        'This will not unban users.',
                    execute: (ctx, [user], flags) => this.pardon(ctx, user.asMember, flags)
                }
            ]
        });
    }

    public async pardon(context: GuildCommandContext, member: Member, flags: FlagResult): Promise<string> {
        const reason = flags.r?.merge().value;
        const count = parse.int(flags.c?.merge().value ?? 1);

        const result = await context.cluster.moderation.warns.pardon(member, context.author, count, reason);
        switch (result.state) {
            case 'countNaN': return this.error(`${flags.c?.merge().value ?? ''} isnt a number!`);
            case 'countNegative': return this.error('I cant give a negative amount of pardons!');
            case 'countZero': return this.error('I cant give zero pardons!');
            case 'success': return this.success(`**${humanize.fullName(member.user)}** has been given ${p(count, 'a pardon', `${count} pardons`)}. They now have ${result.warnings} warnings.`);
        }
    }
}
