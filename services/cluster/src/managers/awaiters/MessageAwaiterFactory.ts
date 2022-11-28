import { Logger } from '@blargbot/logger';
import Eris from 'eris';

import { Awaiter } from './Awaiter';
import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class MessageAwaiterFactory extends AwaiterFactoryBase<Eris.KnownMessage> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(message: Eris.KnownMessage): string {
        return message.channel.id;
    }

    public getAwaiter(pools: Iterable<string>, check?: (item: Eris.KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<Eris.KnownMessage>;
    public getAwaiter<T extends Eris.TextableChannel>(pools: Iterable<T>, check?: (item: Eris.Message<T>) => Awaitable<boolean>, timeout?: number): Awaiter<Eris.Message<T>>;
    public getAwaiter(pools: Iterable<string | Eris.KnownTextableChannel>, check?: (item: Eris.KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<Eris.KnownMessage> {
        return super.getAwaiter(getIds(pools), check, timeout);
    }
}

function* getIds(pools: Iterable<string | Eris.KnownTextableChannel>): Iterable<string> {
    for (const pool of pools)
        yield typeof pool === 'string' ? pool : pool.id;
}
