import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.unban;

export interface UnbanUserOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly reason: string;
}

export type UnbanUserResult = ApiResult<null, { cause: 'bot' | 'authorizer' | 'notBanned'; }>

export interface UnbanUserFeature {
    unbanUser(options: UnbanUserOptions): Promise<UnbanUserResult>;
}

type Features = UnbanUserFeature
export class UnbanSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async unbanUser(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<boolean> {
        const targetId = await UserIdSubtag.query(context, userStr, { noLookup: true, global: true })
            ?? new UserNotFoundError(userStr).throw();

        if (reason === '')
            reason = 'Tag Unban';

        const authorizer = noPerms ? context.root.authorizer?.user ?? context.root.message.author : context.root.message.author;
        const result = await this.#features.unbanUser({
            guildId: context.root.guildId,
            targetId,
            moderatorId: context.root.message.author.id,
            authorizerId: authorizer.id,
            reason
        });
        if (result.success)
            return true;
        switch (result.cause) {
            case 'notBanned':
                return false;
            case 'bot':
                throw new BBTagRuntimeError('Bot has no permissions', result.reason);
            case 'authorizer':
                throw new BBTagRuntimeError('User has no permissions', result.reason);
            default:
                throw new BBTagRuntimeError('Unban failed', result.reason);
        }
    }
}
