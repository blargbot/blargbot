import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType, BBTagContext } from '../core';

export class UserGameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'usergame',
            category: SubtagType.API,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the game the executing user is playing. ',
                    exampleCode: 'You are playing {usergame}',
                    exampleOut: 'You are playing with bbtag',
                    execute: (ctx) => (ctx.member.game ?? { name: 'nothing' }).name
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the game `user` is playing. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is playing {usergame;Stupid cat}',
                    exampleOut: 'Stupid cat is playing nothing',
                    execute: (ctx, [userId, quietStr]) => this.getUserGame(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserGame(
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
            const member = context.guild.members.get(user.id);
            if (member !== undefined)
                return (member.game ?? { name: 'nothing' }).name;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
