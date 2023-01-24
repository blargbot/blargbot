import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userActivityType;

@Subtag.id('userActivityType', 'userGameType')
@Subtag.factory()
export class UserActivityTypeSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.USER,
            description: tag.description({ types: Object.values(activityTypeMap) }),
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserActivityType(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
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

const activityTypeMap = {
    default: '',
    0: 'playing',
    1: 'streaming',
    2: 'listening',
    3: 'watching',
    4: 'custom',
    5: 'competing'
} as const;
