import moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userTimeout;

export interface GetMemberTimeoutFeature {
    getMemberTimeout(guildId: string, userId: string): Promise<Temporal.Instant | null | undefined>;
}

type Features = GetMemberTimeoutFeature;
export class UserTimeoutSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userTimeout',
            category: SubtagType.USER,
            aliases: ['timedoutUntil', 'userTimedoutUntil', 'memberTimeout', 'memberTimedoutUntil'],
            description: tag.description,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.findUserTimeout(ctx, format.value, '', true)
                },
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, userId, quiet]) => this.findUserTimeout(ctx, format.value, userId.value, quiet.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async findUserTimeout(
        context: BBTagContext,
        format: string,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.local.quiet ?? false;
        const userId = await UserIdSubtag.query(context, userStr, { noLookup: quiet })
            ?? new UserNotFoundError(userStr).withDisplay(quiet ? '' : undefined).throw();

        return await this.#getUserCommunicationDisabledUntil(context, userId, format);
    }

    async #getUserCommunicationDisabledUntil(context: BBTagContext, userId: string, format: string): Promise<string> {
        const timeout = await this.#features.getMemberTimeout(context.root.guildId, userId)
            ?? new BBTagRuntimeError('User not timed out').throw();

        return moment(timeout.epochMilliseconds).utcOffset(0).format(format);
    }
}
