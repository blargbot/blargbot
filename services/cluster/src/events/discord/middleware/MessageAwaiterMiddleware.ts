import type { AwaiterFactoryBase } from '@blargbot/cluster/managers/awaiters/AwaiterFactoryBase.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as Eris from 'eris';

export class MessageAwaiterMiddleware implements IMiddleware<Eris.KnownMessage, boolean> {
    readonly #awaiter: AwaiterFactoryBase<Eris.KnownMessage>;

    public constructor(awaiter: AwaiterFactoryBase<Eris.KnownMessage>) {
        this.#awaiter = awaiter;
    }

    public async execute(context: Eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await this.#awaiter.tryConsume(context))
            return true;

        return await next();
    }
}
