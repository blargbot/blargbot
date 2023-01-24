import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagUtilities } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.unban;

@Subtag.id('unban')
@Subtag.ctorArgs(Subtag.util())
export class UnbanSubtag extends CompiledSubtag {
    readonly #util: BBTagUtilities;

    public constructor(util: BBTagUtilities) {
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

        this.#util = util;
    }

    public async unbanUser(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<boolean> {
        const user = await context.queryUser(userStr, { noErrors: context.scopes.local.noLookupErrors });

        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Unban';

        const authorizer = noPerms ? context.authorizer?.user ?? context.user : context.user;
        const result = await this.#util.unban(context.guild, user, context.user, authorizer, reason);

        switch (result) {
            case 'success': return true;
            case 'moderatorNoPerms': throw new BBTagRuntimeError('User has no permissions');
            case 'noPerms': throw new BBTagRuntimeError('Bot has no permissions');
            case 'notBanned': return false;
        }
    }
}
