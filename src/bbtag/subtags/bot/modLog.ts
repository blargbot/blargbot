import { parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.modLog;

export interface AddModLogOptions {
    readonly guildId: string;
    readonly action: string;
    readonly targetId: string;
    readonly moderatorId: string;
    readonly reason?: string;
    readonly color?: number;
}

export interface AddModLogThunk {
    (options: AddModLogOptions): Promise<void>;
}

export class ModLogSubtag extends CompiledSubtag {
    readonly #addModLog: AddModLogThunk;
    public constructor({ addModLog }: { addModLog: AddModLogThunk; }) {
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
        this.#addModLog = addModLog;
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
        const mod = await context.queryUser(modStr) ?? context.root.message.author;

        await this.#addModLog({
            guildId: context.root.guildId,
            action,
            targetId: user.id,
            moderatorId: mod.id,
            reason,
            color
        });
    }
}
