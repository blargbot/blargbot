import { UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class WarningsSubtag extends Subtag {
    public constructor() {
        super({
            name: 'warnings',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user?', 'quiet?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
