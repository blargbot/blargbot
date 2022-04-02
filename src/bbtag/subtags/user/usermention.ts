import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UserMentionSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'usermention',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Mentions the executing user.',
                    exampleCode: 'Hello, {usermention}!',
                    exampleOut: 'Hello, @user!',
                    returns: 'string',
                    execute: (ctx) => this.userMention(ctx, ctx.user.id, false)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Mentions `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Hello, {usermention;Stupidcat}!',
                    exampleOut: 'Hello, @Stupid cat!',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.userMention(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async userMention(
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

        if (!context.data.allowedMentions.users.includes(user.id))
            context.data.allowedMentions.users.push(user.id);
        return user.mention;
    }
}