import { BBTagContext, Subtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'userid',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the user ID of the executing user.',
                    exampleCode: 'Your id is {userid}',
                    exampleOut: 'Your id is 123456789123456',
                    returns: 'id',
                    execute: (ctx) => ctx.user.id
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s ID. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'This is Stupid cat\'s user ID {userid;Stupid cat}',
                    exampleOut: 'This is Stupid cat\'s user ID 103347843934212096',
                    returns: 'id',
                    execute: (ctx, [userId, quiet]) => this.getUserId(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserId(
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

        return user.id;
    }
}
