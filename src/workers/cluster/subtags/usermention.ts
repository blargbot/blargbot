import { BaseSubtag, SubtagType, BBTagContext } from '@cluster/core';

export class UserMentionSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usermention',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Mentions the executing user.',
                    exampleCode: 'Hello, {usermention}!',
                    exampleOut: 'Hello, @user!',
                    execute: (ctx) => this.userMention(ctx, ctx.user.id, '')
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Mentions `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Hello, {usermention;Stupidcat}!',
                    exampleOut: 'Hello, @Stupid cat!',
                    execute: (ctx, [userId, quietStr]) => this.userMention(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async userMention(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName}\``
        });

        if (user !== undefined) {
            if (!context.state.allowedMentions.users.includes(user.id))
                context.state.allowedMentions.users.push(user.id);
            return user.mention;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
