import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UserGameSubtag extends BaseSubtag {
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
                    execute: (ctx) => ctx.member.presence?.activities[0]?.name ?? 'nothing'
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the game `user` is playing. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is playing {usergame;Stupid cat}',
                    exampleOut: 'Stupid cat is playing nothing',
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
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            const member = await context.util.getMember(context.guild, user.id);
            if (member !== undefined)
                return member.presence?.activities[0]?.name ?? 'nothing';
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
