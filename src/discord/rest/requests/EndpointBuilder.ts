import { randomUUID } from 'crypto';

import { ResponseMessage } from '../handler';
import { Body, Endpoint, Headers } from './Endpoint';
import { jsonBody } from './jsonBody';
import { multipartBody } from './multipartBody';

export class EndpointBuilder<TParams, TResponse> {
    #id = randomUUID();
    #method: 'get' | 'post' | 'patch' | 'delete' | 'put' | 'create';
    #getRoute?: (params: TParams) => string;
    #readResponse?: (response: ResponseMessage, params: TParams) => Promise<TResponse>;
    #getQuery?: (params: TParams) => Record<string, string | string[] | number | boolean | undefined>;

    #getHeaders: (params: TParams) => Headers;
    readonly #headers: Record<string, Array<(params: TParams) => Headers[string]>>;
    #getBody: (params: TParams) => Body;

    public constructor() {
        this.#getHeaders = () => ({});
        this.#getBody = () => ({ write() { /* NO-OP */ } });
        this.#readResponse = undefined;
        this.#headers = {};
        this.#method = 'get';
    }

    public setId(id: string): this {
        this.#id = id;
        return this;
    }

    public setMethod(method: 'get' | 'post' | 'patch' | 'delete' | 'put' | 'create'): this {
        this.#method = method;
        return this;
    }

    public setRoute(route: string): this;
    public setRoute(getRoute: (params: TParams) => string): this;
    public setRoute(getRoute: string | ((params: TParams) => string)): this {
        this.#getRoute = typeof getRoute === 'string' ? () => getRoute : getRoute;
        return this;
    }

    public setQuery(getQuery?: (params: TParams) => Record<string, string | string[] | number | boolean | undefined>): this {
        this.#getQuery = getQuery ?? (p => p as Record<string, string | string[] | number | undefined>);
        return this;
    }

    public setHeaders(getHeaders: (params: TParams) => Headers): this {
        this.#getHeaders = getHeaders;
        return this;
    }

    public setHeader(name: string, value: Headers[string] | ((params: TParams) => Headers[string])): this {
        const getters = this.#headers[name] ??= [];
        switch (typeof value) {
            case 'number':
            case 'string':
            case 'object':
                getters.push(() => value);
                break;
            case 'function':
                getters.push(value);
                break;
        }
        return this;
    }

    public setBody(getBody: (params: TParams) => Body): this {
        this.#getBody = getBody;
        return this;
    }

    public setResponse(readResponse: (response: ResponseMessage, params: TParams) => Promise<TResponse>): this {
        this.#readResponse = readResponse;
        return this;
    }

    public setEmptyResponse(this: EndpointBuilder<TParams, undefined | void>, statusCode = 204): this {
        return this.setResponse(response => {
            if (response.statusCode !== statusCode)
                return Promise.reject(new Error(`Expected a status code ${statusCode} but got ${response.statusCode}`));
            return Promise.resolve();
        }) as this;
    }

    public setJsonBody(getBody: (params: TParams) => unknown = p => p): this {
        return this.setBody(params => jsonBody(getBody(params)));
    }

    public setMultipartBody(getBody: (params: TParams) => Iterable<{ name: string; filename?: string; body: Body; }>): this {
        return this.setBody(params => multipartBody(getBody(params)));
    }

    public setContentResponse(accept: string, read: (data: Buffer) => Awaitable<TResponse>): this {
        return this.setHeader('Accept', accept)
            .setResponse(async (response) => {
                if (response.statusCode < 200 || response.statusCode >= 300)
                    throw new Error(`Request was not successful (HTTP ${response.statusCode})`);
                if (response.headers['content-type'] !== accept)
                    throw new Error(`Cannot read responses of type ${response.headers['content-type'] ?? 'null'}`);

                const chunks = [];
                for await (const chunk of response.body)
                    chunks.push(chunk as Uint8Array);
                return await read(Buffer.concat(chunks));
            });
    }

    public setJsonResponse(): this {
        return this.setContentResponse('application/json', buffer => JSON.parse(buffer.toString('utf-8')) as TResponse);
    }

    public setBufferResponse(this: EndpointBuilder<TParams, ArrayBuffer | Buffer>, accept: string): this {
        return this.setContentResponse(accept, buffer => buffer) as this;
    }
    public build(): Endpoint<TParams, TResponse> {
        return Object.freeze(this.#build());
    }

    #build(): Endpoint<TParams, TResponse> {
        const headers = Object.entries(this.#headers).map(x => [x[0], [...x[1]]] as const);
        const getHeaders = this.#getHeaders;
        if (this.#getRoute === undefined)
            throw new Error('No route set');
        if (this.#readResponse === undefined)
            throw new Error('No response reader set');

        let getRoute = this.#getRoute;
        if (this.#getQuery !== undefined) {
            const getPath = getRoute;
            const getQuery = this.#getQuery;
            getRoute = (params) => {
                const baseRoute = getPath(params);
                const query = getQuery(params);
                const parameters = Object.entries(query)
                    .filter((e): e is [typeof e[0], Exclude<typeof e[1], undefined>] => e[1] !== undefined)
                    .flatMap(e => Array.isArray(e[1]) ? e[1].map(v => [e[0], v] as const) : [[e[0], e[1].toString()] as const])
                    .map(e => `${encodeURIComponent(e[0])}=${encodeURIComponent(e[1])}`);
                return `${baseRoute}${baseRoute.includes('?') ? '&' : '?'}${parameters.join('&')}`;
            };
        }

        return {
            id: this.#id,
            method: this.#method,
            getBody: this.#getBody,
            getRoute: getRoute,
            readResponse: this.#readResponse,
            getHeaders(params) {
                const kvp = [
                    ...headers.flatMap(([name, getters]) => getters.map(h => [name, h(params)] as const)),
                    ...Object.entries(getHeaders(params))
                ];
                return kvp.reduce<Headers>((p, [name, value]) => {
                    const current = p[name];
                    if (value === undefined) {
                        // NO-OP
                    } else if (current === undefined) {
                        p[name] = value;
                    } else {
                        let arr: string[];
                        switch (typeof current) {
                            case 'string':
                                arr = p[name] = [current];
                                break;
                            case 'number':
                                arr = p[name] = [current.toString()];
                                break;
                            case 'object':
                                arr = current;
                                break;
                        }

                        switch (typeof value) {
                            case 'string':
                                arr.push(value);
                                break;
                            case 'number':
                                arr.push(value.toString());
                                break;
                            case 'object':
                                arr.push(...value);
                                break;
                        }
                    }

                    return p;
                }, {});
            }
        };
    }
}
