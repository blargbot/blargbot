import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { guard } from '@blargbot/core/utils';
import { KnownMessage } from 'eris';

export class IgnoreBotsMiddleware implements IMiddleware<KnownMessage, boolean> {
    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.bot || guard.hasValue(context.webhookID))
            return false;
        return await next();
    }
}
