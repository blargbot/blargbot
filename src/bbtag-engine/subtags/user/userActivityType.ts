import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userActivityType;

export interface GetMemberActivityTypeFeature {
    getMemberActivityType(guildId: string, userId: string): Promise<number | null | undefined>;
}

type Features = GetMemberActivityTypeFeature;
export class UserActivityTypeSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userActivityType',
            aliases: ['userGameType'],
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
        this.#features = features;
    }

    public async getUserActivityType(
        context: BBTagContext,
        userStr: string,
        quiet: boolean
    ): Promise<typeof activityTypeMap[keyof typeof activityTypeMap]> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        const activityType = await this.#features.getMemberActivityType(context.root.guildId, userId);
        if (typeof activityType !== 'number' || !Object.hasOwn(activityTypeMap, activityType))
            return activityTypeMap.default;
        return activityTypeMap[activityType];
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
