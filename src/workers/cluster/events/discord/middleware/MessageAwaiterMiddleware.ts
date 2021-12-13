import { AwaiterFactoryBase } from '@cluster/managers/awaiters/AwaiterFactoryBase';
import { IMiddleware, NextMiddleware } from '@core/types';
import { KnownMessage } from 'eris';

export class MessageAwaiterMiddleware implements IMiddleware<KnownMessage, boolean> {
    public constructor(private readonly awaiter: AwaiterFactoryBase<KnownMessage>) {
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await this.awaiter.tryConsume(context))
            return true;

        return await next();
    }
}
