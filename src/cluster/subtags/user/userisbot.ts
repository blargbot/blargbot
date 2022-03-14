import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserIsBotSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'userisbot',
            category: SubtagType.USER,
            aliases: ['userbot'],
            definition: [
                {
                    parameters: [],
                    description: 'Returns whether the executing user is a bot.',
                    exampleCode: 'Are you a bot? {userisbot}',
                    exampleOut: 'Are you a bot? false',
                    returns: 'boolean',
                    execute: (ctx) => this.getUserIsBot(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns whether a `user` is a bot. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Is Stupid cat a bot? {userisbot;Stupid cat}',
                    exampleOut: 'Stupid cat\'s username is Stupid cat!',
                    returns: 'boolean',
                    execute: (ctx, [userId, quiet]) => this.getUserIsBot(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserIsBot(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return user.bot;
    }
}
