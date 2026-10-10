import type { Logger } from '@blargbot/logger';
import type eris from 'eris';

import type { Awaiter } from './Awaiter.js';
import { AwaiterFactoryBase } from './AwaiterFactoryBase.js';

export class MessageAwaiterFactory extends AwaiterFactoryBase<eris.KnownMessage> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(message: eris.KnownMessage): string {
        return message.channel.id;
    }

    public getAwaiter(pools: Iterable<string>, check?: (item: eris.KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<eris.KnownMessage>;
    public getAwaiter<T extends eris.TextableChannel>(pools: Iterable<T>, check?: (item: eris.Message<T>) => Awaitable<boolean>, timeout?: number): Awaiter<eris.Message<T>>;
    public getAwaiter(pools: Iterable<string | eris.KnownTextableChannel>, check?: (item: eris.KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<eris.KnownMessage> {
        return super.getAwaiter(getIds(pools), check, timeout);
    }
}

function* getIds(pools: Iterable<string | eris.KnownTextableChannel>): Iterable<string> {
    for (const pool of pools)
        yield typeof pool === 'string' ? pool : pool.id;
}
