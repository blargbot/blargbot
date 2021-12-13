import { BBTagContext, Subtag } from '@cluster/bbtag';
import { BBTagRuntimeError, UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';
import { Member } from 'eris';
import moment from 'moment-timezone';

export class UserBoostDataSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userboostdate',
            category: SubtagType.USER,
            desc: 'See the [moment documentation](http://momentjs.com/docs/#/displaying/format/) for more information about formats. ' +
                'If user is not boosting the guild, returns `User not boosting`',
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the date that the executing user started boosting the guild using `format` for the output, in UTC+0.',
                    exampleCode: 'Your account started boosting this guild on {userboostdate;YYYY/MM/DD HH:mm:ss}',
                    exampleOut: 'Your account started boosting this guild on 2020/02/27 00:00:00',
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserBoostDate(ctx.member, format.value)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
                    exampleOut: 'stupid cat is boosting!',
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
        if (user.premiumSince === 0)
            throw new BBTagRuntimeError('User not boosting');

        return moment(user.premiumSince).format(format);
    }
}
