import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

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
                    execute: (ctx) => (ctx.member.game || {name: 'nothing'}).name
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the game `user` is playing. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is playing {usergame;Stupid cat}',
                    exampleOut: 'Stupid cat is playing nothing',
                    execute: (ctx, args) => this.getUserGame(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserGame(
        context: BBTagContext,
        args: string[]
    ): Promise<string> {
        const quiet = typeof context.scope.quiet === 'boolean' ? context.scope.quiet : !!args[1];
        const user = await context.getUser(args[0], {
            quiet, suppress: context.scope.suppressLookup,
            label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
        });

        if (user) {
            const member = context.guild.members.get(user.id);
            if (member)
                return (member.game || {name: 'nothing'}).name;
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}