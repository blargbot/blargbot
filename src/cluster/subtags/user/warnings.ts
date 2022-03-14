import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { UserNotFoundError } from '@blargbot/cluster/bbtag/errors';
import { SubtagType } from '@blargbot/cluster/utils';

export class WarningsSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'warnings',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?', 'quiet?'],
                    description: 'Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.',
                    exampleCode: 'You have {warnings} warning(s)!',
                    exampleOut: 'You have 0 warning(s)!',
                    returns: 'number',
                    execute: (context, [user, quiet]) => this.getUserWarnings(context, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserWarnings(context: BBTagContext, userQuery: string, quiet: boolean): Promise<number> {
        const user = await context.queryUser(userQuery, { noLookup: quiet });

        if (user === undefined)
            throw new UserNotFoundError(userQuery);

        return await context.database.guilds.getWarnings(context.guild.id, user.id) ?? 0;
    }
}
