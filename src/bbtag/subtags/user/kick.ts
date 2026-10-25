import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';

const tag = templates.subtags.kick;

export interface KickUserOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly authorizerId: string;
    readonly reason: string;
}

export type KickUserResult = ApiResult<null, { cause: 'bot' | 'authorizer'; }>

export interface KickUserThunk {
    (options: KickUserOptions): Promise<KickUserResult>;
}

export class KickSubtag extends CompiledSubtag {
    readonly #kickUser: KickUserThunk;
    public constructor({ kickUser }: { kickUser: KickUserThunk; }) {
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
        this.#kickUser = kickUser;
    }

    public async kickMember(
        context: BBTagContext,
        userStr: string,
        reason: string,
        noPerms: boolean
    ): Promise<string> {
        const member = await context.queryMember(userStr, { noLookup: true /* TODO why? */ });
        if (member === undefined)
            throw new UserNotFoundError(userStr);

        if (reason === '')
            reason = 'Tag Kick';

        const authorizer = noPerms ? context.root.authorizer?.user ?? context.root.message.author : context.root.message.author;
        const result = await this.#kickUser({
            guildId: context.root.guildId,
            targetId: member.id,
            moderatorId: context.root.message.author.id,
            authorizerId: authorizer.id,
            reason
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
