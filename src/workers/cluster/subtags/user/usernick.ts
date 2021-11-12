import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserNickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usernick',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the nickname of the executing user.',
                    exampleCode: 'Your nick is {usernick}!',
                    exampleOut: 'Your nick is Cool Dude 1337!',
                    returns: 'string',
                    execute: (ctx) => (ctx.member.nickname ?? ctx.user.username).replace(/@/g, '@\u200b')
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s nickname. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s nickname is {usernick;Stupid cat}!',
                    exampleOut: 'Stupid cat\'s nickname is Secretly Awoken',
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
            // We dont want this error to appear in the output
            context.scopes.local.fallback = '';
            throw new UserNotFoundError(userId);
        }

        return member.displayName.replace(/@/g, '@\u200b');
    }
}
