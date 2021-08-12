import { Cluster } from '@cluster';
import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { parse, SubtagType } from '@cluster/utils';
import { User } from 'discord.js';

export class WarnSubtag extends BaseSubtag {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({
            name: 'warn',
            category: SubtagType.BOT,
            desc: '`user` defaults to the authorizer of the tag', //TODO change this to executing user
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gives `user` one warning. This will return the amount of warnings `user` has after executing.',
                    exampleCode: 'Be warned! {warn}',
                    exampleOut: 'Be warned! 1',
                    execute: (ctx, args, subtag) => this.warnUser(ctx, args[0].value, '1', '', subtag)
                },
                {
                    parameters: ['user', 'count:1', 'reason?'],
                    description: 'Gives `user` `count` warnings.',
                    exampleCode: 'Be warned Stupid cat! {warn;Stupid cat;9001;For being too cool}',
                    exampleOut: 'Be warned Stupid cat! 9001',
                    execute: (ctx, args, subtag) => this.warnUser(ctx, args[0].value, args[1].value, args[2].value, subtag)
                }
            ]
        });
    }

    public async warnUser(
        context: BBTagContext,
        userStr: string,
        countStr: string,
        reason: string,
        subtag: SubtagCall
    ): Promise<string> {
        let user: User | string | undefined = context.authorizer;
        const count = parse.int(countStr);

        if (userStr !== '')
            user = await context.getUser(userStr, {
                suppress: context.scope.suppressLookup,
                label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
            });

        if (typeof user === 'string')
            user = await context.util.getUserById(user);

        if (user === undefined)
            return this.noUserFound(context, subtag);

        if (isNaN(count))
            return this.notANumber(context, subtag);

        const member = await context.util.getMemberById(context.guild, user.id);

        if (member === undefined)
            return this.noUserFound(context, subtag);
        const result = await this.cluster.moderation.warns.warn(member, user, count, reason !== '' ? reason : 'Tag Warning');
        return result.count.toString();
    }
}