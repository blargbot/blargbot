import { Cluster } from '../cluster';
import { BaseSubtag, BBTagContext } from '../core/bbtag';
import { SubtagType } from '../utils';

const gameTypes = {
    default: '',
    0: 'playing',
    1: 'streaming',
    2: 'listening',
    3: 'watching',
    4: 'custom',
    5: 'competing'
};

export class UserGameTypeSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'usergametype',
            category: SubtagType.API,
            desc: 'Game types can be any of `' + Object.values(gameTypes).filter(type => type).join(', ') + '`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns how the executing user is playing a game (playing, streaming).',
                    exampleCode: 'You are {usergametype} right now!',
                    exampleOut: 'You are streaming right now!',
                    execute: (ctx) => gameTypes[ctx.member.game ? ctx.member.game.type : 'default']
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns how `user` is playing a game. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is {usergametype;Stupid cat} cats',
                    exampleOut: 'Stupid cat is streaming cats',
                    execute: (ctx, args) => this.getUserGameType(ctx, args.map(arg => arg.value))
                }
            ]
        });
    }

    public async getUserGameType(
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
            if (member) {
                return gameTypes[member.game ? member.game.type : 'default'] || gameTypes.default;
            }
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}