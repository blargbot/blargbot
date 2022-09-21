import stream from 'stream';

import { ResponseMessage } from '../handler';

export type Headers = Record<string, string | string[] | number | undefined>;
export interface Body {
    write(stream: stream.Writable): Awaitable<void>;
    headers?: Headers;
}
export interface Endpoint<TParams = unknown, TResponse = unknown> {
    readonly id: string;
    readonly method: string;
    getRoute(params: TParams): string;
    getHeaders(params: TParams): Headers;
    getBody(params: TParams): Awaitable<Body>;
    readResponse(response: ResponseMessage, params: TParams): Promise<TResponse>;
}
