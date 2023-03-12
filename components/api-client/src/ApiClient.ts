import type { HttpClientOptions, HttpHeaders } from './HttpClient.js';
import { HttpClient } from './HttpClient.js';
import { readResponse } from './readResponse.js';

export type ApiClient<Endpoint extends ApiClientEndpoint> = {
    [E in Endpoint as E['name']]: (this: ApiClient<Endpoint>, request: E['request'], abort?: AbortSignal) => Promise<E['response']>
}

export interface ApiClientConstructor<Endpoint extends ApiClientEndpoint, Config> {
    new(options: HttpClient | HttpClientOptions | string | URL, config: Config): ApiClient<Endpoint>;
}

export interface ApiClientEndpoint<Name extends PropertyKey = PropertyKey, Request = unknown, Response = unknown> {
    readonly name: Name;
    readonly request: Request;
    readonly response: Response;
}

export interface ApiClientBuilder<Config = void> {
    readonly _config?: Config;
    withConfig<Config>(): ApiClientBuilder<Config>;
}

export interface ApiClientEndpointRootBuilder<Config> {
    route<R = void>(path: ValueOrFactory<string, [request: R, config: Config]>): ApiClientEndpointBuilder<Config, R>;
    route<R = void>(method: string, path: ValueOrFactory<string, [request: R, config: Config]>): ApiClientEndpointBuilder<Config, R>;
}

export interface ApiClientEndpointBuilder<Config, Request = void, Response = never> {
    query(value: ValueOrFactory<Record<string, QueryValue | QueryValue[]>, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    validate(validator: (request: Request, config: Config) => void): ApiClientEndpointBuilder<Config, Request, Response>;
    header(name: string, value: string, ...values: string[]): ApiClientEndpointBuilder<Config, Request, Response>;
    headers(headers: ValueOrFactory<HttpHeaders, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    body(content: ValueOrFactory<Blob, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    response<R = void>(code: number): ApiClientEndpointBuilder<Config, Request, Response | R>;
    response<R>(code: number, reader: (content: Blob, headers: HttpHeaders, config: Config) => Awaitable<R>): ApiClientEndpointBuilder<Config, Request, Response | R>;
}

export interface ApiClientEndpointFactory<Config, Request, Response> {
    (builder: ApiClientEndpointRootBuilder<Config>): ApiClientEndpointBuilder<Config, Request, Response>;
}
export type ApiClientEndpointFactories<Config> = Record<PropertyKey, ApiClientEndpointFactory<Config, unknown, unknown>>;
export type ApiClientEndpointFactoriesToEndpoints<Config, Factories extends ApiClientEndpointFactories<Config>> = {
    [P in keyof Factories]: Factories[P] extends ApiClientEndpointFactory<Config, infer Request, infer Response> ? ApiClientEndpoint<P, Request, Response> : never;
}[keyof Factories]

export function defineApiClient<Methods extends ApiClientEndpointFactories<void>>(
    factories: Methods
): ApiClientConstructor<ApiClientEndpointFactoriesToEndpoints<void, Methods>, void>
export function defineApiClient<Config, Methods extends ApiClientEndpointFactories<Config>>(
    options: (builder: ApiClientBuilder) => ApiClientBuilder<Config>,
    factories: Methods
): ApiClientConstructor<ApiClientEndpointFactoriesToEndpoints<Config, Methods>, Config>
export function defineApiClient<Config, Methods extends ApiClientEndpointFactories<Config>>(
    ...args: [
        factories: Methods
    ] | [
        options: (builder: ApiClientBuilder) => ApiClientBuilder<Config>,
        factories: Methods
    ]
): ApiClientConstructor<ApiClientEndpointFactoriesToEndpoints<Config, Methods>, Config> {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [configure, factories] = typeof args[0] === 'function' ? [args[0], args[1]!] : [undefined, args[0]];

    configure?.({
        withConfig<Config>() {
            return this as ApiClientBuilder<Config>;
        }
    });

    let defineHandler: <Request, Response>(name: PropertyKey, handler: ApiClientEndpointHandler<Config, Request, Response>) => void;
    class ApiClient {
        static {
            defineHandler = <Request, Response>(name: PropertyKey, handler: ApiClientEndpointHandler<Config, Request, Response>) => Object.assign(ApiClient.prototype, {
                async [name](this: ApiClient, request: Request, abort?: AbortSignal): Promise<Response> {
                    return await handler(this.#client, request, this.#config, abort);
                }
            });
        }

        readonly #client: HttpClient;
        readonly #config: Config;

        public constructor(options: HttpClient | HttpClientOptions | string | URL, config: Config) {
            this.#config = config;
            if (options instanceof URL || typeof options === 'string')
                this.#client = new HttpClient({ baseAddress: options });
            else if (options instanceof HttpClient)
                this.#client = options;
            else
                this.#client = new HttpClient(options);
        }
    }

    for (const [name, configure] of Object.entries(factories)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let builder: ApiClientEndpointBuilderImpl<Config, any, void> | undefined;
        configure({
            route<R>(...args: [method: string, route: ValueOrFactory<string, [request: R, config: Config]>] | [route: ValueOrFactory<string, [request: R, config: Config]>]): ApiClientEndpointBuilder<Config, R> {
                if (builder !== undefined)
                    throw new Error('Cannot set multiple routes for one API method');
                const [method, route] = args[1] === undefined ? ['GET', args[0]] : [args[0] as string, args[1]];
                return builder = new ApiClientEndpointBuilderImpl(method, typeof route === 'function' ? route : () => route);
            }
        });
        if (builder === undefined)
            throw new Error(`No route was provided for API method ${name}`);
        defineHandler(name, builder.build());
    }

    ApiClient satisfies ApiClientConstructor<never, Config>;

    return ApiClient as unknown as ApiClientConstructor<ApiClientEndpointFactoriesToEndpoints<Config, Methods>, Config>;
}

type ValueOrFactory<T, Args extends readonly unknown[]> = T | ((...args: Args) => T)
type QueryValue = string | number | boolean | bigint | null | undefined

class ApiClientEndpointBuilderImpl<Config, Request, Response> implements ApiClientEndpointBuilder<Config, Request, Response> {
    readonly #method: string;
    readonly #route: (request: Request, config: Config) => string;
    readonly #headers: Array<(request: Request, config: Config) => HttpHeaders> = [];
    readonly #responses: Record<number, (content: Blob, headers: HttpHeaders, config: Config) => Awaitable<Response>> = {};
    readonly #validators: Array<(request: Request, config: Config) => void> = [];
    readonly #query: Array<(request: Request, config: Config) => Record<string, QueryValue | QueryValue[]>> = [];
    #body?: (request: Request, config: Config) => Awaitable<Blob>;

    public constructor(method: string, route: (request: Request, config: Config) => string) {
        this.#method = method;
        this.#route = route;
    }

    public query(value: ValueOrFactory<Record<string, QueryValue | QueryValue[]>, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response> {
        this.#query.push(typeof value === 'function' ? value : () => value);
        return this;
    }

    public validate(validator: (request: Request, config: Config) => void): ApiClientEndpointBuilder<Config, Request, Response> {
        this.#validators.push(validator);
        return this;
    }

    public header(name: string, value: string, ...values: string[]): ApiClientEndpointBuilder<Config, Request, Response> {
        this.#headers.push(() => ({ [name]: [value, ...values] }));
        return this;
    }

    public headers(headers: ValueOrFactory<HttpHeaders, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response> {
        this.#headers.push(typeof headers === 'function' ? headers : () => headers);
        return this;
    }

    public body(content: ValueOrFactory<Awaitable<Blob>, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response> {
        if (this.#body !== undefined)
            throw new Error('Content has already been set');
        this.#body = typeof content === 'function' ? content : () => content;
        return this;
    }

    public response(code: number): ApiClientEndpointBuilder<Config, Request, Response | void>;
    public response<R>(code: number, reader: (content: Blob, headers: HttpHeaders, config: Config) => Awaitable<R>): ApiClientEndpointBuilder<Config, Request, Response | R>
    public response(code: number, reader?: (content: Blob, headers: HttpHeaders, config: Config) => Awaitable<Response>): ApiClientEndpointBuilder<Config, Request, Response> {
        this.#responses[code] = reader ?? readResponse;
        return this;
    }

    public build(): ApiClientEndpointHandler<Config, Request, Response> {
        const method = this.#method;
        const headers = [...this.#headers];
        const responses = { ...this.#responses };
        const validators = [...this.#validators];
        const query = [...this.#query];
        const route = this.#route;
        const body = this.#body;

        return async (client, request, config, abort) => {
            for (const validator of validators)
                validator(request, config);

            let url = route(request, config);
            if (query.length > 0) {
                const queryString = Object.entries(
                    query.reduce<Record<string, string[]>>((p, c) => {
                        for (const [key, value] of Object.entries(c(request, config))) {
                            const values = p[key] ??= [];
                            for (const v of Array.isArray(value) ? value : [value])
                                if (v !== undefined && v !== null)
                                    values.push(v.toString());
                        }
                        return p;
                    }, {}))
                    .flatMap(e => e[1].map(v => `${encodeURIComponent(e[0])}=${encodeURIComponent(v)}`))
                    .join('&');
                if (queryString.length === 0)
                    url += `${url.includes('?') ? '&' : '?'}${queryString}`;
            }

            const response = await client.send({
                method,
                url,
                content: await body?.(request, config),
                headers: headers.reduce<Record<string, string[]>>((acc, h) => {
                    for (const [header, value] of Object.entries(h(request, config))) {
                        const values = acc[header] ??= [];
                        if (typeof value === 'string')
                            values.push(value);
                        else if (Array.isArray(value))
                            values.push(...value);
                    }
                    return acc;
                }, {})
            }, abort);

            if (response.statusCode in responses)
                return await responses[response.statusCode](await response.content(), response.headers, config);

            throw new Error(`Unexpected response ${response.statusCode} ${response.statusMessage}`);
        };
    }
}

interface ApiClientEndpointHandler<Config, Request, Response> {
    (client: HttpClient, request: Request, config: Config, abort?: AbortSignal): Awaitable<Response>;
}
