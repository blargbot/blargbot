import stream from 'stream';

import { Headers } from '../requests';

export interface RequestOptions {
    id: string;
    method: string;
    endpoint: string;
    headers: Headers;
    write: (stream: stream.Writable) => Awaitable<void>;
    abort?: AbortSignal;
}
