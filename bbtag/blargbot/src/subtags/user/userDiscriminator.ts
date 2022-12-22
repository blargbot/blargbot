import { UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class UserDiscriminatorSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userDiscriminator',
            aliases: ['userDiscrim'],
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserDiscrim(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserDiscrim(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserDiscrim(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return user.discriminator;
    }
}
