import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.unban;

export interface UnbanUserOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly reason: string;
}

export type UnbanUserResult =
    | { success: true; }
    | { success: false; reason: 'bot' | 'authorizer' | 'notBanned'; };

export interface UnbanUserThunk {
    (options: UnbanUserOptions): Promise<UnbanUserResult>;
}

export class UnbanSubtag extends CompiledSubtag {
    readonly #unbanUser: UnbanUserThunk;
    public constructor({ unbanUser }: { unbanUser: UnbanUserThunk; }) {
        super({
            name: 'unban',
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
        this.#unbanUser = unbanUser;
    }

    public async unbanUser(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<boolean> {
        const user = await context.queryUser(userStr, { noErrors: context.local.noLookupErrors });

        if (user === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Unban';

        const authorizer = noPerms ? context.root.authorizer?.user ?? context.root.message.author : context.root.message.author;
        const result = await this.#unbanUser({
            guildId: context.root.guildId,
            targetId: user.id,
            moderatorId: context.root.message.author.id,
            authorizerId: authorizer.id,
            reason
        });
        if (result.success)
            return true;
        switch (result.reason) {
            case 'notBanned':
                return false;
            case 'bot':
                throw new BBTagRuntimeError('Bot has no permissions');
            case 'authorizer':
                throw new BBTagRuntimeError('User has no permissions');
            default:
                throw new BBTagRuntimeError('Unban failed');
        }
    }
}
