import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class IgnoreBotsMiddleware implements IMiddleware<KnownMessage, boolean> {
    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.bot)
            return false;
        return await next();
    }
}
