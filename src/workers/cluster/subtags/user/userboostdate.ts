import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import moment from 'moment-timezone';

export class UserBoostDataSubtag extends BaseSubtag {
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
                    execute: (ctx, [{ value: format }], subtag) => {
                        const boostDate = ctx.member.premiumSinceTimestamp;
                        if (boostDate === null)
                            return this.customError('User not boosting', ctx, subtag);
                        return moment(boostDate).format(format);
                    }
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the date that `user` started boosting the current guild using `format` for the output, in UTC+0. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
                    exampleOut: 'stupid cat is boosting!',
                    execute: async (context, [{ value: format }, { value: userStr }, { value: quietStr }], subtag): Promise<string> => {
                        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
                        const member = userStr === '' ? context.member : await context.queryMember(userStr, {
                            noErrors: context.scopes.local.noLookupErrors,
                            noLookup: quiet
                        });
                        if (member === undefined) {
                            // TODO
                            // if (quiet)
                            return '';
                            // throw new UserNotFoundError(userStr);
                        }

                        const boostDate = member.premiumSinceTimestamp;
                        if (boostDate === null)
                            return this.customError('User not boosting', context, subtag);
                        return moment(boostDate).format(format);
                    }
                }
            ]
        });
    }
}
