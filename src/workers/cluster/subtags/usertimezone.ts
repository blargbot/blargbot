import { BaseSubtag, BBTagContext, SubtagType } from '../core';

export class UserTimezoneSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usertimezone',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the set timezone of the user executing the containing tag.',
                    exampleCode: '{usertimezone}',
                    exampleOut: 'UTC',
                    execute: async (ctx) => {
                        const userTimezone = await ctx.database.users.getSetting(ctx.user.id, 'timezone');
                        return userTimezone ?? 'UTC';
                    }
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the set timezone code of the specified `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.' +
                        'If the user has no set timezone, the output will be UTC.',
                    exampleCode: 'Discord official\'s timezone is {usertimezone;Discord official}',
                    exampleOut: 'Discord official\'s timezone is Europe/Berlin',
                    execute: (ctx, [userId, quietStr]) => this.getUserTimezone(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserTimezone(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });
        if (user === undefined)
            return quiet ? '' : ''; //TODO add behavior for this??? Old code did nothing if user didnt exist

        const userTimezone = await context.database.users.getSetting(user.id, 'timezone');
        return userTimezone ?? 'UTC';
    }
}
