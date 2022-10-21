import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.modlog;

export class ModlogSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'modlog',
            category: SubtagType.BOT,
            description: tag.description,
            definition: [
                {
                    parameters: ['action', 'user', 'moderator?', 'reason?', 'color?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [action, user, moderator, reason, color]) => this.createModlog(ctx, action.value, user.value, moderator.value, reason.value, color.value)
                }
            ]
        });
    }

    public async createModlog(
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

        await context.util.addModlog(context.guild, action, user, mod, reason, color);
    }
}
