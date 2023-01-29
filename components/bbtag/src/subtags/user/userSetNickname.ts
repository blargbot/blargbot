import type { Logger } from '@blargbot/logger';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userSetNickname;

@Subtag.names('userSetNickname', 'setNickname', 'setNick', 'userSetNick')
@Subtag.ctorArgs(Subtag.service('user'), Subtag.logger())
export class UserSetNickSubtag extends CompiledSubtag {
    readonly #users: UserService;
    readonly #logger: Logger;

    public constructor(users: UserService, logger: Logger) {
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

        this.#users = users;
        this.#logger = logger;
    }

    public async setUserNick(context: BBTagContext, nick: string, userStr: string): Promise<void> {
        const user = await this.#users.querySingle(context, userStr);

        if (user?.member === undefined)
            throw new UserNotFoundError(userStr);

        try {
            await this.#users.edit(context, user.id, { nick });
        } catch (err: unknown) {
            this.#logger.error(err);
            if (err instanceof Error)
                throw new BBTagRuntimeError('Could not change nickname');
            throw err;
        }
    }
}
