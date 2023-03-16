import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.unban;

@Subtag.id('unban')
@Subtag.ctorArgs('users')
export class UnbanSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['user'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [user]) => this.unbanUser(ctx, user.value, '', false)
                },
                {
                    parameters: ['user', 'reason', 'noPerms?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [user, reason, noPerms]) => this.unbanUser(ctx, user.value, reason.value, noPerms.value !== '')
                }
            ]
        });

        this.#users = users;
    }

    public async unbanUser(
        context: BBTagScript,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<boolean> {
        const user = await this.#users.querySingle(context.runtime, userStr);

        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Unban';

        const authorizer = noPerms ? context.runtime.authorizer : context.runtime.user;
        const result = await this.#users.unban(context.runtime.guild, user, context.runtime.user, authorizer, reason);

        switch (result) {
            case 'success': return true;
            case 'moderatorNoPerms': throw new BBTagRuntimeError('User has no permissions');
            case 'noPerms': throw new BBTagRuntimeError('Bot has no permissions');
            case 'notBanned': return false;
        }
    }
}
