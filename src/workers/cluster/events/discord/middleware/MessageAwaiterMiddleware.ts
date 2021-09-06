import { MessageAwaitManager } from '@cluster/managers';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class MessageAwaiterMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly awaiter: MessageAwaitManager) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        if (await this.awaiter.checkMessage(context))
            return true;

        return await next();
    }
}
