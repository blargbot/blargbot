import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UserIdSubtag extends CompiledSubtag {
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
                    execute: (ctx) => this.getUserId(ctx, '', true)
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
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userStr, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return user.id;
    }
}
