import { Cluster } from '@cluster';
import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotANumberError, UserNotFoundError } from '@cluster/bbtag/errors';
import { parse, SubtagType } from '@cluster/utils';

export class WarnSubtag extends BaseSubtag {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({
            name: 'warn',
            category: SubtagType.USER,
            desc: '`user` defaults to the executing user.',
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gives `user` one warning. This will return the amount of warnings `user` has after executing.',
                    exampleCode: 'Be warned! {warn}',
                    exampleOut: 'Be warned! 1',
                    returns: 'number',
                    execute: (ctx, [user]) => this.warnUser(ctx, user.value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: 'Gives `user` `count` warnings.',
                    exampleCode: 'Be warned Stupid cat! {warn;Stupid cat;9001;For being too cool}',
                    exampleOut: 'Be warned Stupid cat! 9001',
                    returns: 'number',
                    execute: (ctx, [user, count, reason]) => this.warnUser(ctx, user.value, count.value, reason.value)
                }
            ]
        });
    }

    public async warnUser(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const count = parse.int(countStr);

        const member = userStr === ''
            ? context.member
            : await context.queryMember(userStr);

        if (member === undefined)
            throw new UserNotFoundError(userStr);

        if (isNaN(count))
            throw new NotANumberError(countStr);

        const result = await this.cluster.moderation.warns.warn(member, this.cluster.discord.user, count, reason !== '' ? reason : 'Tag Warning');
        return result.warnings;
    }
}
