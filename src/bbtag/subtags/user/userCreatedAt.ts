import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userCreatedAt;

export interface GetUserCreatedTimestampFeature {
    getUserCreatedTimestamp(userId: string): Promise<Temporal.Instant | undefined>;
}

type Features = GetUserCreatedTimestampFeature;
export class UserCreatedAtSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userCreatedAt',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserCreatedAt(ctx, format.value, '', true)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, user, quiet]) => this.getUserCreatedAt(ctx, format.value, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async getUserCreatedAt(context: BBTagContext, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet, global: true })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        const timestamp = await this.#features.getUserCreatedTimestamp(userId)
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return moment(timestamp.epochMilliseconds).utcOffset(0).format(format);
    }
}
