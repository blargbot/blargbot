import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities, BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.timeout;

@Subtag.names('timeout')
@Subtag.ctorArgs(Subtag.util(), Subtag.converter(), Subtag.service('user'))
export class TimeoutSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;

    public constructor(util: BBTagUtilities, converter: BBTagValueConverter, users: UserService) {
        super({
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

        this.#util = util;
        this.#converter = converter;
        this.#users = users;
    }

    public async timeoutMember(
        context: BBTagContext,
        userStr: string,
        duration: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const delay = this.#converter.duration(duration);
        if (delay === undefined)
            throw new BBTagRuntimeError('Invalid duration');

        const user = await this.#users.querySingle(context, userStr, { noLookup: true /* TODO why? */ });
        if (user?.member === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Timeout';

        const authorizer = noPerms ? context.authorizer : context.user;
        const response = delay.asMilliseconds() !== 0
            ? await this.#util.timeout(user, context.user, authorizer, delay, reason)
            : await this.#util.clearTimeout(user, context.user, authorizer, reason);

        switch (response) {
            case 'success':
                return 'Success';
            case 'notTimedOut':
                throw new BBTagRuntimeError('User is not timed out', `${user.username} is not timed out!`);
            case 'alreadyTimedOut':
                throw new BBTagRuntimeError('User is already timed out', `${user.username} is already timed out!`);
            case 'noPerms':
                throw new BBTagRuntimeError('Bot has no permissions', 'I don\'t have permission to (remove) time out (from) users!');
            case 'memberTooHigh':
                throw new BBTagRuntimeError('Bot has no permissions', `I don't have permission to (remove) time out (from) ${user.username}!`);
            case 'moderatorNoPerms':
                throw new BBTagRuntimeError('User has no permissions', 'You don\'t have permission to (remove) time out (from) users!');
            case 'moderatorTooLow':
                throw new BBTagRuntimeError('User has no permissions', `You don't have permission to (remove) time out (from) ${user.username}!`);
        }
    }
}
