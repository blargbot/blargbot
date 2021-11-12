import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class WarningsSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'warnings',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?'],
                    description: 'Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.',
                    exampleCode: 'You have {warnings} warning(s)!',
                    exampleOut: 'You have 0 warning(s)!',
                    returns: 'number',
                    execute: (context, [user]) => this.getUserWarnings(context, user.value)
                }
            ]
        });
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string): Promise<number> {
        const user = userQuery.length > 0
            ? await context.queryUser(userQuery)
            : context.user;

        if (user === undefined)
            throw new UserNotFoundError(userQuery);

        return await context.database.guilds.getWarnings(context.guild.id, user.id) ?? 0;
    }
}
