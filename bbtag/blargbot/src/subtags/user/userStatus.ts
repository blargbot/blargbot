import { UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class UserStatusSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userStatus',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserStatus(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserStatus(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserStatus(
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

        return member.status ?? 'offline';
    }
}
