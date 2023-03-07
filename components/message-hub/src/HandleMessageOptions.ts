import type amqplib from 'amqplib';

import type { ConsumeMessage } from './ConsumeMessage.js';

export interface HandleMessageOptions {
    queue: string;
    filter: string | Iterable<string>;
    handle: (this: void, data: Blob, message: ConsumeMessage) => Awaitable<Blob | void>;
    queueArgs?: amqplib.Options.AssertQueue;
    consumeArgs?: amqplib.Options.Consume;
    exchange?: string;
}
