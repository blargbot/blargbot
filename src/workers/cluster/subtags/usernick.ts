import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserNickSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'usernick',
            category: SubtagType.API,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the nickname of the executing user.',
                    exampleCode: 'Your nick is {usernick}!',
                    exampleOut: 'Your nick is Cool Dude 1337!',
                    execute: (ctx) => (ctx.member.nickname ?? ctx.user.username).replace(/@/g, '@\u200b')
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `user`\'s nickname. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat\'s nickname is {usernick;Stupid cat}!',
                    exampleOut: 'Stupid cat\'s nickname is Secretly Awoken',
                    execute: (ctx, [userId, quietStr]) => this.getUserNick(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserNick(
        context: BBTagContext,
        userId: string,
        quietStr: string
    ): Promise<string> {
        const quiet = context.scope.quiet !== undefined ? context.scope.quiet : quietStr.length > 0;
        const user = await context.getUser(userId, {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName}\``
        });

        if (user !== undefined) {
            const member = await context.util.getMemberById(context.guild, user.id);
            if (member !== undefined)
                return (member.nickname ?? user.username).replace(/@/g, '@\u200b');
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
