import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext, SubtagCall } from '../core/bbtag';
import { SubtagType } from '../utils';
import moment from 'moment';

export class UserJoineDatSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'userjoinedat',
            category: SubtagType.API,
            desc: 'For a list of formats see the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.',
            definition: [
                {
                    parameters: ['format?'],
                    description: 'Returns the date that the executing user joined the guild, using `format` for the output, in UTC+0.\n' +
                        '`format` defaults to `YYYY-MM-DDTHH:mm:ssZ`',
                    exampleCode: 'Your account joined this guild on {usercreatedat;YYYY/MM/DD HH:mm:ss}',
                    exampleOut: 'Your account joined this guild on 2016/01/01 01:00:00.',
                    execute: (ctx, args, subtag) => this.getUserJoinDate(ctx, [args.map(arg => arg.value)[0] || '', ctx.user.id], subtag)
                },
                {
                    parameters: ['format', 'user', 'quiet?'],
                    description: 'Returns the date that `user` joined the current guild using `format` for the output, in UTC+0. if `user` can\'t be found it will simply return nothing.' + '`format` defaults to `YYYY-MM-DDTHH:mm:ssZ`',
                    exampleCode: 'Stupid cat joined this guild on {userjoinedat;YYYY/MM/DD HH:mm:ss;Stupid cat}',
                    exampleOut: 'Stupid cat joined this guild on 2016/06/19 23:30:30',
                    execute: (ctx, args, subtag) => this.getUserJoinDate(ctx, args.map(arg => arg.value), subtag)
                }
            ]
        });
    }

    public async getUserJoinDate(
        context: BBTagContext,
        args: string[],
        subtag: SubtagCall
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[2];
        const user = await context.getUser(args[1], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            const member = context.guild.members.get(user.id);
            if (member != null)
                return moment(member.joinedAt).utcOffset(0).format(args[0] || '');
            return this.customError('User not in guild', context, subtag);
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}