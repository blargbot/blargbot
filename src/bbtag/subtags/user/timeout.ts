import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { convertToDuration } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.timeout;

export interface SetUserTimeoutOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly reason: string;
    readonly duration: Temporal.Duration;
}

export type SetUserTimeoutResult = ApiResult<null, { cause: 'bot' | 'authorizer' | 'noChange'; }>

export interface SetUserTimeoutFeature {
    setMemberTimeout(options: SetUserTimeoutOptions): Promise<SetUserTimeoutResult>;
}

type Features = SetUserTimeoutFeature
export class TimeoutSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'timeout',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user', 'duration'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [user, duration]) => this.timeoutMember(ctx, user.value, duration.value, '', false)
                },
                {
                    parameters: ['user', 'duration', 'reason', 'noPerms?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'string',
                    execute: (ctx, [user, duration, reason, noPerms]) => this.timeoutMember(ctx, user.value, duration.value, reason.value, noPerms.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async timeoutMember(
        context: BBTagContext,
        userStr: string,
        duration: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const delay = convertToDuration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        const targetId = await UserIdSubtag.query(context, userStr, { noLookup: true /* TODO why? */ })
            ?? new UserNotFoundError(userStr).throw();

        if (reason === '')
            reason = 'Tag Timeout';

        const authorizerId = noPerms ? context.root.authorizerId : context.root.userId;
        const result = await this.#features.setMemberTimeout({
            guildId: context.root.guildId,
            targetId,
            moderatorId: context.root.userId,
            authorizerId,
            reason,
            duration: delay
        });
        if (result.success)
            return 'Success';

        switch (result.cause) {
            case 'noChange':
                throw new BBTagRuntimeError(delay.sign === 0
                    ? 'User is not timed out'
                    : 'User is already timed out', result.reason);
            case 'bot':
                throw new BBTagRuntimeError('Bot has no permissions', result.reason);
            case 'authorizer':
                throw new BBTagRuntimeError('User has no permissions', result.reason);
            default:
                throw new BBTagRuntimeError('Timeout failed', result.reason);
        }
    }
}
