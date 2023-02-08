import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { hasValue } from '@blargbot/guards';
import type * as Eris from 'eris';

export class IgnoreBotsMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.bot || hasValue(context.webhookID))
            return false;
        return await next();
    }
}
