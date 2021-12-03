import { BBTagContext, Subtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserNameSubtag extends Subtag {
    public constructor() {
        super({
            name: 'username',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the username of the executing user.',
                    exampleCode: 'Your username is {username}!',
                    exampleOut: 'Your username is Cool Dude 1337!',
                    returns: 'string',
                    execute: (ctx) => this.getUserName(ctx, ctx.user.id, true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s username. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s username is {username;Stupid cat}!',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserName(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserName(
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

        return user.username.replace(/@/g, '@\u200b');
    }
}
