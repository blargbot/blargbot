import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userActivity;

export interface GetMemberActivityNameFeature {
    getMemberActivityName(guildId: string, userId: string): Promise<string | null | undefined>;
}

type Features = GetMemberActivityNameFeature;
export class UserActivitySubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userActivity',
            aliases: ['userGame'],
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx) => this.getUserActivity(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserActivity(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getUserActivity(
        context: BBTagContext,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getMemberActivityName(context.root.guildId, userId) ?? 'nothing';
    }
}
