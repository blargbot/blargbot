import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { ActivityType } from 'discord.js';

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
            category: SubtagType.USER,
            desc: 'Game types can be any of `' + Object.values(gameTypes).filter(type => type).join(', ') + '`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns how the executing user is playing a game (playing, streaming).',
                    exampleCode: 'You are {usergametype} right now!',
                    exampleOut: 'You are streaming right now!',
                    execute: (ctx) => ctx.member.presence?.activities[0]?.type.toLowerCase() ?? ''
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns how `user` is playing a game. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is {usergametype;Stupid cat} cats',
                    exampleOut: 'Stupid cat is streaming cats',
                    execute: (ctx, [userId, quiet]) => this.getUserGameType(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserGameType(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<Lowercase<ActivityType> | ''> {
        quiet ||= context.scope.quiet ?? false;
        const user = await context.queryUser(userId, { noLookup: quiet });

        if (user !== undefined) {
            const member = await context.util.getMember(context.guild, user.id);
            if (member !== undefined) {
                return member.presence?.activities[0]?.type.toLowerCase() ?? '';
            }
        }

        return quiet ? '' : ''; //TODO add behaviour for this????
    }
}
