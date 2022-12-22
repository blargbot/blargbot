import { UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class UserNicknameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userNickname',
            aliases: ['userNick'],
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserNick(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserNick(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserNick(
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

        return member.nick ?? member.username;
    }
}
