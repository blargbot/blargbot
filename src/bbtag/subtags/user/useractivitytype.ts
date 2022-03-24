import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

const activityTypeMap = {
    default: '',
    0: 'playing',
    1: 'streaming',
    2: 'listening',
    3: 'watching',
    4: 'custom',
    5: 'competing'
} as const;

export class UserActivityTypeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'useractivitytype',
            aliases: ['usergametype'],
            category: SubtagType.USER,
            desc: 'Activity types can be any of `' + Object.values(activityTypeMap).filter(type => type).join(', ') + '`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the type of activity the executing user is currently doing (playing, streaming).',
                    exampleCode: 'You are {useractivitytype} right now!',
                    exampleOut: 'You are streaming right now!',
                    returns: 'string',
                    execute: (ctx) => this.getUserActivityType(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the activity type `user` is currently doing. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is {useractivitytype;Stupid cat} cats',
                    exampleOut: 'Stupid cat is streaming cats',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserActivityType(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserActivityType(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<typeof activityTypeMap[keyof typeof activityTypeMap]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        const activityId = member.activities?.[0]?.type ?? 'default';
        return activityTypeMap[activityId].toLowerCase();
    }
}
