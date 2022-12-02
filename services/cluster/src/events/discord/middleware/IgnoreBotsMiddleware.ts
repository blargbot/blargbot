import { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import { guard } from '@blargbot/core/utils/index.js';
import Eris from 'eris';

export class IgnoreBotsMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.bot || guard.hasValue(context.webhookID))
            return false;
        return await next();
    }
}
