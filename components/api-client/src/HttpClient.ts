import type { Readable } from 'node:stream';
import { Writable } from 'node:stream';

import type { ClientRequest, IncomingMessage } from 'http';
import { request } from 'http';

export class HttpClient {
    readonly #defaultHeaders: { readonly [x: string]: string[]; };
    readonly #handler: (message: HttpRequestContext) => Awaitable<HttpResponseMessage>;

    readonly #resolveUrl: (url: string | URL | undefined) => URL;

    public constructor(options: HttpClientOptions = {}) {
        this.#resolveUrl = toUrlResolver(options.baseAddress);
        this.#defaultHeaders = Object.defineProperties({}, Object.fromEntries(
            Object.entries(options.defaultHeaders ?? {})
                .map(([name, val]) => {
                    switch (typeof val) {
                        case 'string': return [name, { get: () => [val] }];
                        case 'object': return [name, { get: () => [...val] }];
                        case 'undefined': return [name, { get: () => [] }];
                    }
                })
        ));
        const middleware = [...options.middleware ?? [], sendHttpRequest];
        const callMiddleware = (index: number, message: HttpRequestContext): Awaitable<HttpResponseMessage> => {
            return middleware[index](message, callMiddleware.bind(null, index + 1, message));
        };
        this.#handler = callMiddleware.bind(null, 0);
    }

    public async send(message: HttpRequestMessage, abort?: AbortSignal): Promise<HttpResponseMessage> {
        return await this.#handler({
            method: message.method ?? 'GET',
            content: message.content,
            headers: this.#resolveHeaders(message.headers),
            url: this.#resolveUrl(message.url),
            abort: abort ?? new AbortController().signal
        });
    }

    #resolveHeaders(headers: HttpHeaders | undefined): HttpHeaders {
        const result = { ...this.#defaultHeaders };
        if (headers === undefined)
            return result;

        for (const [header, value] of Object.entries(headers)) {
            const headers = result[header] ??= [];
            if (Array.isArray(value))
                headers.push(...value);
            else if (value !== undefined)
                headers.push(value);
        }

        return result;
    }
}

function toUrlResolver(url: string | URL | undefined): (url: string | URL | undefined) => URL {
    switch (typeof url) {
        case 'string': return mergeUrls.bind(null, new URL(url));
        case 'object': return mergeUrls.bind(null, url);
        case 'undefined': {
            return function requireUrl(url) {
                switch (typeof url) {
                    case 'undefined': throw new Error('No uri supplied');
                    case 'string': return new URL(url);
                    case 'object': return url;
                }
            };
        }
    }
}

function mergeUrls(baseUrl: URL, url: string | undefined | URL): URL {
    switch (typeof url) {
        case 'undefined': return baseUrl;
        case 'string': return new URL(url, baseUrl);
        case 'object': return url;
    }
}

async function sendHttpRequest(message: HttpRequestContext): Promise<HttpResponseMessage> {
    const [request, response] = createRequest(message.url);
    request.method = message.method;
    for (const [name, values] of Object.entries(message.headers))
        if (values !== undefined)
            request.setHeader(name, values);
    if (message.content !== undefined) {
        request.setHeader('Content-Type', message.content.type);
        request.setHeader('Content-Length', message.content.size);
        await message.content.stream()
            .pipeTo(Writable.toWeb(request), { signal: message.abort });
    }
    request.end();
    const result = await response;
    let content: Promise<Blob>;
    return {
        headers: result.headers,
        statusCode: result.statusCode ?? 0,
        statusMessage: result.statusMessage ?? '',
        content() {
            return content ??= readAsBlob(result, result.headers['content-type']);
        }
    };
}

async function readAsBlob(stream: Readable, type?: string): Promise<Blob> {
    try {
        return await new Promise<Blob>((res, rej) => {
            const chunks: Uint8Array[] = [];
            stream.on('data', (c: Uint8Array) => chunks.push(c));
            stream.once('end', () => res(new Blob(chunks, { type })));
            stream.once('error', rej);
        });
    } catch (err) {
        if (err instanceof Error)
            Error.captureStackTrace(err);
        throw err;
    }
}

function createRequest(url: URL): [ClientRequest, Promise<IncomingMessage>] {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    let req: ClientRequest = null!;
    const response = new Promise<IncomingMessage>(res => req = request(url, res));
    return [req, response];
}

export type HttpRequestMiddleware = (message: HttpRequestContext, next: () => Awaitable<HttpResponseMessage>) => Awaitable<HttpResponseMessage>;

export interface HttpClientOptions {
    readonly defaultHeaders?: HttpHeaders;
    readonly baseAddress?: string | URL;
    readonly middleware?: Iterable<HttpRequestMiddleware>;
}

export interface HttpHeaders {
    readonly [name: string]: string | readonly string[] | undefined;
}

export interface HttpRequestMessage {
    readonly method?: string;
    readonly url?: string | URL;
    readonly headers?: HttpHeaders;
    readonly content?: Blob;
}

export interface HttpRequestContext {
    method: string;
    url: URL;
    headers: HttpHeaders;
    content?: Blob;
    abort: AbortSignal;
}

export interface HttpResponseMessage {
    readonly statusCode: number;
    readonly statusMessage: string;
    readonly headers: HttpHeaders;
    content(): Awaitable<Blob>;
}
