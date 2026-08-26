import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import type * as eris from 'eris';

export class IgnoreBotsMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.bot || guard.hasValue(context.webhookID))
            return false;
        return await next();
    }
}
