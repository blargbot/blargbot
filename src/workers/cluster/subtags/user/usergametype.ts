import { BBTagContext, Subtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

const gameTypes = {
    default: '',
    0: 'playing',
    1: 'streaming',
    2: 'listening',
    3: 'watching',
    4: 'custom',
    5: 'competing'
} as const;

export class UserGameTypeSubtag extends Subtag {
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
                    returns: 'string',
                    execute: (ctx) => this.getUserGameType(ctx, ctx.user.id, true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns how `user` is playing a game. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is {usergametype;Stupid cat} cats',
                    exampleOut: 'Stupid cat is streaming cats',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserGameType(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserGameType(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<typeof gameTypes[keyof typeof gameTypes]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return member.presence?.activities[0]?.type.toLowerCase() ?? '';
    }
}
