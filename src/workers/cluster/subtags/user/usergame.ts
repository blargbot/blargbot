import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserGameSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'usergame',
            category: SubtagType.USER,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the game the executing user is playing. ',
                    exampleCode: 'You are playing {usergame}',
                    exampleOut: 'You are playing with bbtag',
                    returns: 'string',
                    execute: (ctx) => this.getUserGame(ctx, ctx.user.id, true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the game `user` is playing. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is playing {usergame;Stupid cat}',
                    exampleOut: 'Stupid cat is playing nothing',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserGame(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserGame(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return member.activities?.[0]?.name ?? 'nothing';
    }
}
