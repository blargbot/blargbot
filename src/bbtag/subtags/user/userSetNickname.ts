import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { ApiResult } from '../types.js';
import { UserIdSubtag } from './userId.js';

const tag = templates.subtags.userSetNickname;

export interface SetMemberNicknameOptions {
    readonly guildId: string;
    readonly targetId: string;
    readonly nickname: string;
    readonly auditReason: string;
}

export interface SetMemberNicknameFeature {
    setMemberNickname(options: SetMemberNicknameOptions): Promise<ApiResult>;
}

type Features = SetMemberNicknameFeature;
export class UserSetNickSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'userSetNickname',
            category: SubtagType.USER,
            aliases: ['setNickname', 'setNick', 'userSetNick'],
            definition: [
                {
                    parameters: ['nick', 'user?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [nick, user]) => this.setUserNick(ctx, nick.value, user.value)
                }
            ]
        });
        this.#features = features;
    }

    public async setUserNick(context: BBTagContext, nick: string, userStr: string): Promise<void> {
        const targetId = await UserIdSubtag.query(context, userStr)
            ?? new UserNotFoundError(userStr).throw();

        const result = await this.#features.setMemberNickname({
            guildId: context.root.guildId,
            targetId,
            nickname: nick,
            auditReason: context.auditReason()
        });

        if (!result.success)
            throw new BBTagRuntimeError('Could not change nickname', result.reason);
    }
}
