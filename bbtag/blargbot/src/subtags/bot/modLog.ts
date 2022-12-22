import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';
import { parse } from '@blargbot/core/utils/index.js';

import { UserNotFoundError } from '@bbtag/engine';

export class ModLogSubtag extends Subtag {
    public constructor() {
        super({
            name: 'modLog',
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: ['action', 'user', 'moderator?', 'reason?', 'color?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [action, user, moderator, reason, color]) => this.createModLog(ctx, action.value, user.value, moderator.value, reason.value, color.value)
                }
            ]
        });
    }

    public async createModLog(
        context: BBTagContext,
        action: string,
        userStr: string,
        modStr: string,
        reason: string,
        colorStr: string
    ): Promise<void> {
        const user = await context.queryUser(userStr);
        if (user === undefined)
            throw new UserNotFoundError(userStr);

        const color = parse.color(colorStr);

        //TODO no user found for this?
        const mod = await context.queryUser(modStr) ?? context.user;

        await context.util.addModLog(context.guild, action, user, mod, reason, color);
    }
}
