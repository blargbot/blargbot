import { AwaiterFactoryBase } from '@blargbot/cluster/managers/awaiters/AwaiterFactoryBase';
import { IMiddleware, NextMiddleware } from '@blargbot/core/types';
import { KnownMessage } from 'eris';

export class MessageAwaiterMiddleware implements IMiddleware<KnownMessage, boolean> {
    readonly #awaiter: AwaiterFactoryBase<KnownMessage>;

    public constructor(awaiter: AwaiterFactoryBase<KnownMessage>) {
        this.#awaiter = awaiter;
    }

    public async execute(context: KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await this.#awaiter.tryConsume(context))
            return true;

        return await next();
    }
}
