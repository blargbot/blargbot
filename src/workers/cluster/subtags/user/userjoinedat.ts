import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import moment from 'moment';

export class UserJoinedAtSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userjoinedat',
            category: SubtagType.USER,
            desc: 'For a list of formats see the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information.',
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the date that the executing user joined the guild, using `format` for the output, in UTC+0.\n',
                    exampleCode: 'Your account joined this guild on {usercreatedat;YYYY/MM/DD HH:mm:ss}',
                    exampleOut: 'Your account joined this guild on 2016/01/01 01:00:00.',
                    execute: (ctx, [format]) => this.getUserJoinDate(ctx, format.value, ctx.user.id, false)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the date that `user` joined the current guild using `format` for the output, in UTC+0. if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat joined this guild on {userjoinedat;YYYY/MM/DD HH:mm:ss;Stupid cat}',
                    exampleOut: 'Stupid cat joined this guild on 2016/06/19 23:30:30',
                    execute: (ctx, [format, userId, quiet]) => this.getUserJoinDate(ctx, format.value, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserJoinDate(
        context: BBTagContext,
        format: string,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            const member = await context.util.getMember(context.guild, user.id);
            if (member !== undefined)
                return moment(member.joinedAt).utcOffset(0).format(format);
            throw new BBTagRuntimeError('User not in guild');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
