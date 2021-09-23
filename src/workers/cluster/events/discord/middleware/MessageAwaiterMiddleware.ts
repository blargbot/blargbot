import { AwaiterFactoryBase } from '@cluster/managers/awaiters/AwaiterFactoryBase';
import { IMiddleware } from '@core/types';
import { Message } from 'discord.js';

export class MessageAwaiterMiddleware implements IMiddleware<Message, boolean> {
    public constructor(private readonly awaiter: AwaiterFactoryBase<Message>) {
    }

    public async execute(context: Message, next: () => Awaitable<boolean>): Promise<boolean> {
        if (await this.awaiter.tryConsume(context))
            return true;

        return await next();
    }
}
