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

export interface ApiClientBuilder<Methods extends ApiClientEndpoint = never, Config = void> {
    endpoint<Name extends PropertyKey, Request, Response>(
        name: Name,
        configure: (builder: ApiClientEndpointRootBuilder<Config>) => ApiClientEndpointBuilder<Config, Request, Response>
    ): ApiClientBuilder<Methods | ApiClientEndpoint<Name, Request, Response>, Config>;
}

export interface ApiClientRootBuilder<Config = void> extends ApiClientBuilder<never, Config> {
    withConfig<Config>(): ApiClientRootBuilder<Config>;
}

export interface ApiClientEndpointRootBuilder<Config, Request = void> extends ApiClientEndpointBuilder<Config, Request> {
    arg<R>(validator?: (request: R, config: Config) => void): ApiClientEndpointRootBuilder<Config, R>;
}

export interface ApiClientEndpointBuilder<Config, Request = void, Response = never> {
    arg(validator: (request: Request, config: Config) => void): ApiClientEndpointBuilder<Config, Request, Response>;
    route(path: ValueOrFactory<string, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    route(method: string, path: ValueOrFactory<string, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    header(name: string, value: string, ...values: string[]): ApiClientEndpointBuilder<Config, Request, Response>;
    headers(headers: ValueOrFactory<HttpHeaders, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    body(content: ValueOrFactory<Blob, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>;
    response<R = void>(code: number): ApiClientEndpointBuilder<Config, Request, Response | R>;
    response<R>(code: number, reader: (content: Blob, headers: HttpHeaders, config: Config) => Awaitable<R>): ApiClientEndpointBuilder<Config, Request, Response | R>;
}

export function defineApiClient<Config, Endpoint extends ApiClientEndpoint>(
    configure: (builder: ApiClientRootBuilder) => ApiClientBuilder<Endpoint, Config>
): ApiClientConstructor<Endpoint, Config> {
    class ApiClient {
        public readonly client: HttpClient;
        public readonly config: Config;

        public constructor(options: HttpClient | HttpClientOptions | string | URL, config: Config) {
            if (options instanceof URL || typeof options === 'string') {
                this.client = new HttpClient({ baseAddress: options });
            } else if (options instanceof HttpClient) {
                this.client = options;
            } else {
                this.client = new HttpClient(options);
            }
            this.config = config;
        }
    }

    let hasEndpoint = false;
    function assertHasNoEndpoint(): void {
        if (hasEndpoint)
            throw new Error('Configuration is fixed once an endpoint has been added!');
    }

    configure({
        withConfig<Config>() {
            assertHasNoEndpoint();
            return this as ApiClientRootBuilder<Config>;
        },
        endpoint(name, configure) {
            hasEndpoint = true;
            const builder = new ApiClientEndpointBuilderImpl();
            configure(builder as ApiClientEndpointRootBuilder<void, void>);
            const handler = builder.build();
            Object.assign(ApiClient.prototype, {
                async [name](this: ApiClient, request: unknown, abort?: AbortSignal): Promise<unknown> {
                    // eslint-disable-next-line @typescript-eslint/return-await
                    return await handler(this.client, request, this.config, abort);
                }
            });
            return this;
        }
    });

    ApiClient satisfies ApiClientConstructor<never, Config>;

    return ApiClient as ApiClientConstructor<Endpoint, Config>;
}

type ValueOrFactory<T, Args extends readonly unknown[]> = T | ((...args: Args) => T)

class ApiClientEndpointBuilderImpl<Config, Request, Response> implements ApiClientEndpointBuilder<Config, Request, Response>, ApiClientEndpointBuilder<Config, Request> {
    #method = 'GET';
    readonly #headers: Array<(request: Request, config: Config) => HttpHeaders> = [];
    readonly #responses: Record<number, (content: Blob, headers: HttpHeaders, config: Config) => Awaitable<Response>> = {};
    readonly #validators: Array<(request: Request, config: Config) => void> = [];
    #route?: (request: Request, config: Config) => string;
    #body?: (request: Request, config: Config) => Awaitable<Blob>;

    public arg<R extends Request>(validator?: (request: R, config: Config) => void): ApiClientEndpointBuilder<Config, R, Response>
    public arg(validator: (request: Request, config: Config) => void): ApiClientEndpointBuilder<Config, Request, Response>
    public arg(validator?: (request: Request, config: Config) => void): ApiClientEndpointBuilder<Config, Request, Response> {
        if (validator !== undefined)
            this.#validators.push(validator);
        return this;
    }

    public route(route: ValueOrFactory<string, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>
    public route(method: string, route: ValueOrFactory<string, [request: Request, config: Config]>): ApiClientEndpointBuilder<Config, Request, Response>
    public route(...args: [method: string, route: ValueOrFactory<string, [request: Request, config: Config]>] | [route: ValueOrFactory<string, [request: Request, config: Config]>]): ApiClientEndpointBuilder<Config, Request, Response> {
        if (this.#route !== undefined)
            throw new Error('Route has already been set');

        const [method, route] = args[1] === undefined ? [this.#method, args[0]] : [args[0] as string, args[1]];
        this.#method = method;
        this.#route = typeof route === 'function' ? route : () => route;
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

    public build(): (client: HttpClient, request: Request, config: Config, abort?: AbortSignal) => Awaitable<Response> {
        const method = this.#method;
        const headers = [...this.#headers];
        const responses = { ...this.#responses };
        const validators = [...this.#validators];
        const route = this.#route;
        const body = this.#body;

        if (route === undefined)
            throw new Error('No route was set!');

        return async (client, request, config, abort) => {
            for (const validator of validators)
                validator(request, config);

            const response = await client.send({
                method,
                url: route(request, config),
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
