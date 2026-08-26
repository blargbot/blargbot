import type { AwaiterFactoryBase } from '@blargbot/cluster/managers/awaiters/AwaiterFactoryBase.js';
import type { IMiddleware, NextMiddleware } from '@blargbot/core/types.js';
import type * as eris from 'eris';

export class MessageAwaiterMiddleware implements IMiddleware<eris.KnownMessage, boolean> {
    readonly #awaiter: AwaiterFactoryBase<eris.KnownMessage>;

    public constructor(awaiter: AwaiterFactoryBase<eris.KnownMessage>) {
        this.#awaiter = awaiter;
    }

    public async execute(context: eris.KnownMessage, next: NextMiddleware<boolean>): Promise<boolean> {
        if (await this.#awaiter.tryConsume(context))
            return true;

        return await next();
    }
}
