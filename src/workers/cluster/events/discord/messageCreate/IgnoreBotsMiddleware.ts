import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class IgnoreBotsMiddleware implements IMiddleware<Message, boolean> {
    public execute(context: Message, next: (context?: Message) => Awaitable<boolean>): Awaitable<boolean> {
        if (context.author.bot)
            return false;
        return next();
    }
}
