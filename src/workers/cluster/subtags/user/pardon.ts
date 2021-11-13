import { BBTagContext, Subtag } from '@cluster/bbtag';
import { NotANumberError, UserNotFoundError } from '@cluster/bbtag/errors';
import { Cluster } from '@cluster/Cluster';
import { parse, SubtagType } from '@cluster/utils';

export class PardonSubtag extends Subtag {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({
            name: 'pardon',
            category: SubtagType.USER,
            desc: '`user` defaults to the executing user. Returns the new warning count',
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gives `user` one pardon.',
                    exampleCode: 'Be pardoned! {pardon}',
                    exampleOut: 'Be pardoned! 0',
                    returns: 'number',
                    execute: (ctx, args) => this.pardon(ctx, args[0].value, '1', '')
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: 'Gives `user` `count` pardons with `reason`.',
                    exampleCode: 'Be pardoned 9001 times, Stupid cat! {pardon;Stupid cat;9001}',
                    exampleOut: 'Be pardoned 9001 times, Stupid cat! 0',
                    returns: 'number',
                    execute: (ctx, args) => this.pardon(ctx, args[0].value, args[1].value, args[2].value)
                }
            ]
        });
    }

    public async pardon(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string
    ): Promise<number> {
        const member = userStr === ''
            ? context.member
            : await context.queryMember(userStr);
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        const count = parse.int(countStr, false);
        if (count === undefined)
            throw new NotANumberError(countStr);

        const result = await this.cluster.moderation.warns.pardon(member, this.cluster.discord.user, count, reason === '' ? 'Tag Pardon' : reason);
        return result.warnings;
    }
}
