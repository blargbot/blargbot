import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserMentionSubtag extends BaseSubtag {
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
                    execute: (ctx) => this.userMention(ctx, ctx.user.id, false)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Mentions `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Hello, {usermention;Stupidcat}!',
                    exampleOut: 'Hello, @Stupid cat!',
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
        quiet ||= context.scope.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            if (!context.state.allowedMentions.users.includes(user.id))
                context.state.allowedMentions.users.push(user.id);
            return user.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
