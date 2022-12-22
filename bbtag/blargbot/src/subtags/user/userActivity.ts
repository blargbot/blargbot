import { UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class UserActivitySubtag extends Subtag {
    public constructor() {
        super({
            name: 'userActivity',
            aliases: ['userGame'],
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserActivity(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserActivity(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserActivity(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return member.activities?.[0]?.name ?? 'nothing';
    }
}
