import { Logger } from '@core/Logger';
import { KnownMessage, KnownTextableChannel, Message } from 'eris';

import { Awaiter } from './Awaiter';
import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class MessageAwaiterFactory extends AwaiterFactoryBase<KnownMessage> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(message: KnownMessage): string {
        return message.channel.id;
    }

    public wait(pools: Iterable<string>, check?: (item: KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<KnownMessage>;
    public wait<T extends KnownTextableChannel>(pools: Iterable<T>, check?: (item: Message<T>) => Awaitable<boolean>, timeout?: number): Awaiter<Message<T>>;
    public wait(pools: Iterable<string | KnownTextableChannel>, check?: (item: KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<KnownMessage> {
        return super.wait(getIds(pools), check, timeout);
    }
}

function* getIds(pools: Iterable<string | KnownTextableChannel>): Iterable<string> {
    for (const pool of pools)
        yield typeof pool === 'string' ? pool : pool.id;
}