import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userBoostDate;

export interface GetMemberBoostTimestampFeature {
    getMemberBoostTimestamp(guildId: string, userId: string): Promise<Temporal.Instant | null | undefined>;
}

type Features = GetMemberBoostTimestampFeature;
export class UserBoostDateSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userBoostDate',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',

                    execute: (ctx, [format]) => this.getUserBoostDate(ctx, ctx.local.message.author.id, format.value)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (context, [format, user, quiet]) => this.findUserBoostDate(context, format.value, user.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async findUserBoostDate(context: BBTagContext, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.getUserBoostDate(context, userId, format);
    }

    public async getUserBoostDate(context: BBTagContext, userId: string, format: string): Promise<string> {
        const timestamp = await this.#features.getMemberBoostTimestamp(context.root.guildId, userId) ?? null;
        if (timestamp === null)
            throw new BBTagRuntimeError('User not boosting');

        return moment(timestamp.epochMilliseconds).utcOffset(0).format(format);
    }
}
