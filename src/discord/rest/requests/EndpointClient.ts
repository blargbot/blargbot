import { RequestHandler } from '../handler';
import { Endpoint } from './Endpoint';
import { EndpointClientOptions } from './EndpointClientOptions';

export class EndpointClient {
    readonly #requestHandler: RequestHandler;

    public constructor(options: EndpointClientOptions) {
        this.#requestHandler = options.requestHandler;
    }

    public async send<TResponse>(endpoint: Endpoint<void, TResponse>, params?: undefined, abort?: AbortSignal): Promise<TResponse>
    public async send<TParams, TResponse>(endpoint: Endpoint<TParams, TResponse>, params: TParams, abort?: AbortSignal): Promise<TResponse>
    public async send<TResponse>(endpoint: Endpoint<unknown, TResponse>, params?: unknown, abort?: AbortSignal): Promise<TResponse> {
        const body = await endpoint.getBody(params);
        const response = await this.#requestHandler.send({
            id: endpoint.id,
            method: endpoint.method,
            endpoint: endpoint.getRoute(params),
            headers: {
                ...endpoint.getHeaders(params),
                ...body.headers
            },
            write: stream => body.write(stream),
            abort
        });
        return await endpoint.readResponse(response, params);
    }
}
