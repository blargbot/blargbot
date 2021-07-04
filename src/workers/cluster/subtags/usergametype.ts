import { BaseSubtag, SubtagType, BBTagContext } from '../core';

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
    public constructor() {
        super({
            name: 'usergametype',
            category: SubtagType.API,
            desc: 'Game types can be any of `' + Object.values(gameTypes).filter(type => type).join(', ') + '`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns how the executing user is playing a game (playing, streaming).',
                    exampleCode: 'You are {usergametype} right now!',
                    exampleOut: 'You are streaming right now!',
                    execute: (ctx) => gameTypes[ctx.member.game !== null ? ctx.member.game.type : 'default']
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns how `user` is playing a game. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is {usergametype;Stupid cat} cats',
                    exampleOut: 'Stupid cat is streaming cats',
                    execute: (ctx, [userId, quietStr]) => this.getUserGameType(ctx, userId.value, quietStr.value)
                }
            ]
        });
    }

    public async getUserGameType(
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
            if (member !== undefined) {
                return gameTypes[member.game !== null ? member.game.type : 'default'];
            }
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
