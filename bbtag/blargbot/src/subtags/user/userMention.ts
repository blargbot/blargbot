import { NotABooleanError, UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { parse } from '@blargbot/core/utils/index.js';

export class UserMentionSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userMention',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.userMention(ctx, ctx.user.id, false, 'false')
                },
                {
                    parameters: ['user', 'quiet?', 'noPing?:false'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet, noPing]) => this.userMention(ctx, userId.value, quiet.value !== '', noPing.value)
                }
            ]
        });
    }

    public async userMention(
        context: BBTagContext,
        userId: string,
        quiet: boolean,
        noPingStr: string
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const noPing = parse.boolean(noPingStr);
        if (noPing === undefined)
            throw new NotABooleanError(noPing);

        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        if (!noPing && !context.data.allowedMentions.users.includes(user.id))
            context.data.allowedMentions.users.push(user.id);
        return user.mention;
    }
}
