import type amqplib from 'amqplib';

import type { ConsumeMessage } from './ConsumeMessage.js';

export type HandleMessageOptions =
    | HandleExchangeMessageOptions
    | HandleQueueMessageOptions

interface HandleExchangeMessageOptions extends HandleMessageOptionsBase {
    queue: string;
    filter: string | Iterable<string>;
    exchange: string;
}

interface HandleQueueMessageOptions extends HandleMessageOptionsBase {
    queue: string;
}

interface HandleMessageOptionsBase {
    handle: (this: void, data: Blob, message: ConsumeMessage) => Awaitable<Blob | void>;
    queueArgs?: amqplib.Options.AssertQueue;
    consumeArgs?: amqplib.Options.Consume;
}
