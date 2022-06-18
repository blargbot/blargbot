import { Member } from 'eris';
import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UserBoostDateSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userboostdate',
            category: SubtagType.USER,
            description: 'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. ' +
                'If user is not boosting the guild, returns `User not boosting`',
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the date that the executing user started boosting the guild using `format` for the output, in UTC+0.',
                    exampleCode: 'Your account started boosting this guild on {userboostdate;YYYY/MM/DD HH:mm:ss}',
                    exampleOut: 'Your account started boosting this guild on 2020/02/27 00:00:00',
                    returns: 'string',
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    execute: (ctx, [format]) => this.getUserBoostDate(ctx.member!, format.value)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat started boosting this guild on {userboostdate;YYYY/MM/DD HH:mm:ss;stupid cat}',
                    exampleOut: 'Stupid cat started boosting this guild on 2020/02/27 00:00:00',
                    returns: 'string',
                    execute: (context, [format, user, quiet]) => this.findUserBoostDate(context, format.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async findUserBoostDate(context: BBTagContext, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return this.getUserBoostDate(member, format);
    }

    public getUserBoostDate(user: Member, format: string): string {
        if (typeof user.premiumSince !== 'number')
            throw new BBTagRuntimeError('User not boosting');

        return moment(user.premiumSince).utcOffset(0).format(format);
    }
}
