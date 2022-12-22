import { BBTagRuntimeError, UserNotFoundError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class UserSetNickSubtag extends Subtag {
    public constructor() {
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
    }

    public async setUserNick(context: BBTagContext, nick: string, userStr: string): Promise<void> {
        const member = await context.queryMember(userStr);

        if (member === undefined)
            throw new UserNotFoundError(userStr);

        try {
            await member.edit({ nick }, context.auditReason());
            member.nick = nick;
        } catch (err: unknown) {
            context.logger.error(err);
            if (err instanceof Error)
                throw new BBTagRuntimeError('Could not change nickname');
            throw err;
        }
    }
}
