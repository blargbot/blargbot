import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserTimezoneSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usertimezone',
            category: SubtagType.USER,
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
                    execute: (ctx, [userId, quiet]) => this.getUserTimezone(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserTimezone(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scope.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });
        if (user === undefined)
            return quiet ? '' : ''; //TODO add behavior for this??? Old code did nothing if user didnt exist

        const userTimezone = await context.database.users.getSetting(user.id, 'timezone');
        return userTimezone ?? 'UTC';
    }
}
