import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { GetMemberBoostTimestampFeature } from './userBoostDate.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.isUserBoosting;

type Features = GetMemberBoostTimestampFeature;
export class IsUserBoostingSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'isUserBoosting',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',

                    execute: (ctx) => this.isUserBoosting(ctx, ctx.local.userId)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [user, quiet]) => this.findIsUserBoosting(ctx, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async findIsUserBoosting(context: BBTagContext, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.isUserBoosting(context, userId);
    }

    public async isUserBoosting(context: BBTagContext, userId: string): Promise<boolean> {
        return (await this.#features.getMemberBoostTimestamp(context.root.guildId, userId) ?? null) !== null;
    }
}
