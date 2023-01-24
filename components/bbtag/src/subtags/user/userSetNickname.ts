import type { Logger } from '@blargbot/logger';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userSetNickname;

@Subtag.id('userSetNickname', 'setNickname', 'setNick', 'userSetNick')
@Subtag.factory(Subtag.logger())
export class UserSetNickSubtag extends CompiledSubtag {
    readonly #logger: Logger;

    public constructor(logger: Logger) {
        super({
            category: SubtagType.USER,
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

        this.#logger = logger;
    }

    public async setUserNick(context: BBTagContext, nick: string, userStr: string): Promise<void> {
        const member = await context.queryMember(userStr);

        if (member === undefined)
            throw new UserNotFoundError(userStr);

        try {
            await member.edit({ nick }, context.auditReason());
            member.nick = nick;
        } catch (err: unknown) {
            this.#logger.error(err);
            if (err instanceof Error)
                throw new BBTagRuntimeError('Could not change nickname');
            throw err;
        }
    }
}
