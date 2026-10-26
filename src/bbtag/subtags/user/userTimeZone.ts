import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userTimeZone;

export interface GetUserTimezoneFeature {
    getUserTimezone(userId: string): Awaitable<string | undefined>;
}

type Features = GetUserTimezoneFeature
export class UserTimezoneSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userTimeZone',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: ctx => this.getUserTimezone(ctx, '', false)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserTimezone(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getUserTimezone(
        context: BBTagContext,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet, global: true })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#features.getUserTimezone(userId) ?? 'UTC';
    }
}
