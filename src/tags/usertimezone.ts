import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

export class UserTimezoneSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
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
                        return userTimezone || 'UTC';
                    }
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the set timezone code of the specified `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.' +
                        'If the user has no set timezone, the output will be UTC.',
                    exampleCode: 'Discord official\'s timezone is {usertimezone;Discord official}',
                    exampleOut: 'Discord official\'s timezone is Europe/Berlin',
                    execute: (ctx, args) => this.getUserTimezone(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserTimezone(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });
        if (!user)
            return quiet ? '' : ''; //TODO add behavior for this??? Old code did nothing if user didnt exist

        const userTimezone = await context.database.users.getSetting(user.id, 'timezone');
        return userTimezone || 'UTC';
    }
}