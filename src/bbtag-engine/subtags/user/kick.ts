import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.kick;

export interface KickUserOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly auditReason: string;
}

export type KickUserResult = ApiResult<null, { cause: 'bot' | 'authorizer'; }>

export interface KickMemberFeature {
    kickMember(options: KickUserOptions): Promise<KickUserResult>;
}

type Features = KickMemberFeature
export class KickSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'kick',
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['user'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [user]) => this.kickMember(ctx, user.value, '', false)
                },
                {
                    parameters: ['user', 'reason', 'noPerms?'],
                    description: tag.withReason.description,
                    exampleCode: tag.withReason.exampleCode,
                    exampleOut: tag.withReason.exampleOut,
                    returns: 'string',
                    execute: (ctx, [user, reason, noPerms]) => this.kickMember(ctx, user.value, reason.value, noPerms.value !== '')
                }
            ]
        });
        this.#features = features;
    }

    public async kickMember(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const targetId = await UserIdSubtag.query(context, userStr, { noLookup: true /* TODO why? */ })
            ?? new UserNotFoundError(userStr).throw();

        if (reason === '')
            reason = 'Tag Kick';

        const authorizerId = noPerms ? context.root.authorizerId : context.root.userId;
        const result = await this.#features.kickMember({
            guildId: context.root.guildId,
            targetId: targetId,
            moderatorId: context.root.userId,
            authorizerId,
            auditReason: reason
        });
        if (result.success)
            return 'Success';

        switch (result.cause) {
            case 'bot':
                throw new BBTagRuntimeError('Bot has no permissions', result.reason);
            case 'authorizer':
                throw new BBTagRuntimeError('User has no permissions', result.reason);
            default:
                throw new BBTagRuntimeError('Kick failed', result.reason);
        }
    }
}
