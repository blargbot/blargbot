import { Logger } from '@blargbot/logger';
import { KnownMessage, KnownTextableChannel, Message, TextableChannel } from 'eris';

import { Awaiter } from './Awaiter';
import { AwaiterFactoryBase } from './AwaiterFactoryBase';

export class MessageAwaiterFactory extends AwaiterFactoryBase<KnownMessage> {
    public constructor(logger: Logger) {
        super(logger);
    }

    protected getPoolId(message: KnownMessage): string {
        return message.channel.id;
    }

    public getAwaiter(pools: Iterable<string>, check?: (item: KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<KnownMessage>;
    public getAwaiter<T extends TextableChannel>(pools: Iterable<T>, check?: (item: Message<T>) => Awaitable<boolean>, timeout?: number): Awaiter<Message<T>>;
    public getAwaiter(pools: Iterable<string | KnownTextableChannel>, check?: (item: KnownMessage) => Awaitable<boolean>, timeout?: number): Awaiter<KnownMessage> {
        return super.getAwaiter(getIds(pools), check, timeout);
    }
}

function* getIds(pools: Iterable<string | KnownTextableChannel>): Iterable<string> {
    for (const pool of pools)
        yield typeof pool === 'string' ? pool : pool.id;
}
