import { parse } from '@blargbot/core';
import type moment from 'moment-timezone';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.timeout;

export interface SetUserTimeoutOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly reason: string;
    readonly duration: moment.Duration;
}

export type SetUserTimeoutResult =
    | { success: true; }
    | { success: false; reason: 'bot' | 'authorizer' | 'noChange'; detail?: string; }

export interface SetUserTimeoutThunk {
    (options: SetUserTimeoutOptions): Promise<SetUserTimeoutResult>;
}

export class TimeoutSubtag extends CompiledSubtag {
    readonly #setUserTimeout: SetUserTimeoutThunk;
    public constructor({ setUserTimeout }: { setUserTimeout: SetUserTimeoutThunk; }) {
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
        this.#setUserTimeout = setUserTimeout;
    }

    public async timeoutMember(
        context: BBTagContext,
        userStr: string,
        duration: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const delay = parse.duration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        const member = await context.queryMember(userStr, { noLookup: true /* TODO why? */ });
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Timeout';

        const authorizer = noPerms ? context.root.authorizer?.user ?? context.root.message.author : context.root.message.author;
        const result = await this.#setUserTimeout({
            guildId: context.root.guildId,
            targetId: member.id,
            moderatorId: context.root.message.author.id,
            authorizerId: authorizer.id,
            reason,
            duration: delay
        });
        if (result.success)
            return 'Success';

        switch (result.reason) {
            case 'noChange':
                throw new BBTagRuntimeError(delay.asMilliseconds() === 0 ? 'User is not timed out' : 'User is already timed out', result.detail);
            case 'bot':
                throw new BBTagRuntimeError('Bot has no permissions', result.detail);
            case 'authorizer':
                throw new BBTagRuntimeError('User has no permissions', result.detail);
            default:
                throw new BBTagRuntimeError('Timeout failed', result.detail);
        }
    }
}
