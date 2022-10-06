import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class TimeoutSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `timeout`,
            category: SubtagType.USER,
            description: `If the timeout is successful, \`Success\` will be returned, otherwise the error will be given. `,
            definition: [
                {
                    parameters: [`user`, `duration`],
                    description: `Times out \`user\` for the specified amount of time. Maximum is 28 days.`,
                    exampleCode: `{timeout;stupid cat;1d} @stupid cat was timed out for 1 day!`,
                    exampleOut: `Success @stupid cat was timed out for 1 day!`,
                    returns: `string`,
                    execute: (ctx, [user, duration]) => this.timeoutMember(ctx, user.value, duration.value, ``, false)
                },
                {
                    parameters: [`user`, `duration`, `reason`, `noPerms?`],
                    description: `Times out \`user\` for the specified amount of time. Maximum is 28 days.If \`noPerms\` is provided and not an empty string, do not check if the command executor is actually able to time out people. Only provide this if you know what you're doing.`,
                    exampleCode: `{timeout;stupid cat;1d;because I can} @stupid cat was timed out for 1 day!`,
                    exampleOut: `Success @stupid cat was timed out for 1 day, because I can!`,
                    returns: `string`,
                    execute: (ctx, [user, duration, reason, noPerms]) => this.timeoutMember(ctx, user.value, duration.value, reason.value, noPerms.value !== ``)
                }
            ]
        });
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
            throw new BBTagRuntimeError(`Invalid duration`);

        const member = await context.queryMember(userStr, { noLookup: true /* TODO why? */ });
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === ``)
            reason = `Tag Timeout`;

        const authorizer = noPerms ? context.authorizer?.user ?? context.user : context.user;
        const response = delay.asMilliseconds() !== 0
            ? await context.util.timeout(member, context.user, authorizer, delay, reason)
            : await context.util.clearTimeout(member, context.user, authorizer, reason);

        switch (response) {
            case `success`:
                return `Success`;
            case `notTimedOut`:
                throw new BBTagRuntimeError(`User is not timed out`, `${member.user.username} is not timed out!`);
            case `alreadyTimedOut`:
                throw new BBTagRuntimeError(`User is already timed out`, `${member.user.username} is already timed out!`);
            case `noPerms`:
                throw new BBTagRuntimeError(`Bot has no permissions`, `I don't have permission to (remove) time out (from) users!`);
            case `memberTooHigh`:
                throw new BBTagRuntimeError(`Bot has no permissions`, `I don't have permission to (remove) time out (from) ${member.user.username}!`);
            case `moderatorNoPerms`:
                throw new BBTagRuntimeError(`User has no permissions`, `You don't have permission to (remove) time out (from) users!`);
            case `moderatorTooLow`:
                throw new BBTagRuntimeError(`User has no permissions`, `You don't have permission to (remove) time out (from) ${member.user.username}!`);
        }
    }
}
