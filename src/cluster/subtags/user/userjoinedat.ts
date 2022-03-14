import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import moment from 'moment';

export class UserJoinedAtSubtag extends DefinedSubtag {
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
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserJoinDate(ctx, format.value, '', false)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the date that `user` joined the current guild using `format` for the output, in UTC+0. if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat joined this guild on {userjoinedat;YYYY/MM/DD HH:mm:ss;Stupid cat}',
                    exampleOut: 'Stupid cat joined this guild on 2016/06/19 23:30:30',
                    returns: 'string',
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
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return moment(member.joinedAt).utcOffset(0).format(format);
    }
}
