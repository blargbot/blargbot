import endpoints from './endpoints';
import { MiddlewareRequestHandler, RequestHandler } from './handler';
import { DiscordAuthorizationRequestMiddleware } from './middleware/DiscordAuthorizationRequestMiddleware';
import { DiscordRestErrorRequestMiddleware } from './middleware/DiscordRestErrorRequestMiddleware';
import { RatelimitRequestMiddleware } from './middleware/RatelimitRequestMiddleware';
import { RequestMiddleware } from './middleware/RequestMiddleware';
import { ResponseCompressionRequestMiddleware } from './middleware/ResponseCompressionRequestMiddleware';
import { Endpoint, EndpointClient } from './requests';

type UnionToIntersection<U> = (U extends unknown ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
type DiscordRestEndpointIO = UnionToIntersection<{
    [P in keyof typeof endpoints]: {
        [Q in keyof typeof endpoints[P]]: (typeof endpoints[P][Q]) extends Endpoint<infer Arg, infer Result> ? { [X in `${P}${Capitalize<Q & string>}`]: { in: Arg; out: Result; } } : never
    }[keyof typeof endpoints[P]]
}[keyof typeof endpoints]>;

type DiscordRestClientBase = {
    readonly [P in keyof DiscordRestEndpointIO]: (arg: DiscordRestEndpointIO[P]['in'], abort?: AbortSignal) => Promise<DiscordRestEndpointIO[P]['out']>;
}

interface DiscordRestClientBaseConstructor {
    new(client: EndpointClient): DiscordRestClientBase;
    prototype: DiscordRestClientBase;
}

// Using an old style function otherwise typescript complains that I haven't declared all the properties and I cba to do that at the moment!
// eslint-disable-next-line @typescript-eslint/naming-convention
export const DiscordRestClientBase = (function DiscordRestClientBase(this: DiscordRestClientBase, client: EndpointClient): DiscordRestClientBase {
    Object.defineProperty(this, 'client', { value: client, writable: false, configurable: false, enumerable: false });
    return this;
}) as unknown as DiscordRestClientBaseConstructor;
for (const [domain, routes] of Object.entries(endpoints)) {
    for (const [name, endpoint] of Object.entries(routes)) {
        const methodName = `${domain}${name.slice(0, 1).toUpperCase()}${name.slice(1)}` as keyof DiscordRestClientBase;
        Object.defineProperty(DiscordRestClientBase.prototype, methodName, {
            value: {
                async [methodName](this: { client: EndpointClient; }, arg: unknown, abort?: AbortSignal) {
                    return await this.client.send(endpoint as Endpoint<unknown, unknown>, arg, abort);
                }
            }[methodName],
            writable: false,
            configurable: false,
            enumerable: false
        });
    }
}

export class DiscordRestClient extends DiscordRestClientBase {
    public constructor(options: DiscordRestClientOptions) {
        super(new EndpointClient({
            requestHandler: options.requestHandler ?? new MiddlewareRequestHandler(options.baseUrl ?? 'https://discord.com/api/v10', [
                new DiscordRestErrorRequestMiddleware(),
                ...options.middleware ?? [],
                new DiscordAuthorizationRequestMiddleware(options.token ?? ''),
                new ResponseCompressionRequestMiddleware(),
                new RatelimitRequestMiddleware()
            ])
        }));
    }
}

export interface DiscordRestClientOptions {
    readonly token?: string;
    readonly requestHandler?: RequestHandler;
    readonly middleware?: readonly RequestMiddleware[];
    readonly baseUrl?: string;
}
