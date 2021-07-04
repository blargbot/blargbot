import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class UserIsBotSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'userisbot',
            category: SubtagType.API,
            aliases: ['userbot'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns whether the executing user is a bot.',
                    exampleCode: 'Are you a bot? {userisbot}',
                    exampleOut: 'Are you a bot? false',
                    execute: (ctx) => ctx.user.bot.toString()
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Is Stupid cat a bot? {userisbot;Stupid cat}',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    execute: (ctx, [userId, quietStr]) => this.getUserIsBot(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserIsBot(
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
            return user.bot.toString();
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
