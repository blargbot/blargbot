import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import moment from 'moment-timezone';

export class UserCreateDatSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usercreatedat',
            category: SubtagType.API,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: 'Returns the account creation date of the executing user in `format`.',
                    exampleCode: 'Your account was created on {usercreatedat}',
                    exampleOut: 'Your account was created on 2017-02-06T18:58:10+00:00',
                    execute: (ctx, [{value: format}]) => {
                        return moment(ctx.user.createdAt).utcOffset(0).format(format);
                    }
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: 'Returns the account creation date of `user` in `format`. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s account was created on {usercreatedat;;Stupid cat}',
                    exampleOut: 'Stupid cat\'s account was created on 2015-10-13T04:27:26Z',
                    execute: async (context, [{value: format}, {value: userStr}, {value: quietStr}]): Promise<string | void> => {
                        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : quietStr !== '';
                        const user = await context.getUser(userStr, {
                            quiet,
                            suppress: context.scope.suppressLookup,
                            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
                        });

                        if (user !== undefined)
                            return moment(user.createdAt).utcOffset(0).format(format);

                        if (quiet)
                            return '';
                        //TODO return no user found if quiet is not true
                        //return this.noUserFound(context, subtag);
                    }
                }
            ]
        });
    }
}
