import { BBTagContext, Subtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserDiscrimSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userdiscrim',
            category: SubtagType.USER,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the discriminator of the executing user.',
                    exampleCode: 'Your discrim is {userdiscrim}',
                    exampleOut: 'Your discrim is 1234',
                    returns: 'string',
                    execute: (ctx) => ctx.user.discriminator
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s discriminator. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s discriminator is {userdiscrim;Stupid cat}',
                    exampleOut: 'Stupid cat\'s discriminator is 8160',
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
