import { IMiddleware, NextMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class IgnoreBotsMiddleware implements IMiddleware<Message, boolean> {
    public async execute(context: Message, next: NextMiddleware<boolean>): Promise<boolean> {
        if (context.author.bot)
            return false;
        return await next();
    }
}
