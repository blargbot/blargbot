import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { NotANumberError } from '@cluster/bbtag/errors';
import { Cluster } from '@cluster/Cluster';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { GuildMember, User } from 'discord.js';

export class PardonSubtag extends BaseSubtag {
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
                    execute: (ctx, args, subtag) => this.pardon(ctx, args[0].value, '1', '', subtag)
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: 'Gives `user` `count` pardons with `reason`.',
                    exampleCode: 'Be pardoned 9001 times, Stupid cat! {pardon;Stupid cat;9001}',
                    exampleOut: 'Be pardoned 9001 times, Stupid cat! 0',
                    execute: (ctx, args, subtag) => this.pardon(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async pardon(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string,
        subtag: SubtagCall
    ): Promise<string> {
        let user: User | undefined = context.user;
        const count = parse.int(countStr);
        let member: GuildMember | undefined;
        if (userStr !== '')
            user = await context.queryUser(userStr);

        if (user !== undefined) {
            member = await context.util.getMember(context.guild.id, user.id);
        }

        if (user === undefined || member === undefined)
            return this.noUserFound(context, subtag);
        if (isNaN(count))
            throw new NotANumberError(countStr);

        const result = await this.cluster.moderation.warns.pardon(member, this.cluster.discord.user, count, reason === '' ? 'Tag Pardon' : reason);
        return result.toString();
    }
}
