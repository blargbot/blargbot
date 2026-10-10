import type { DiscordRestChannel } from '@blargbot/contracts';
import type { MakeRequestOptions, RequestMethods, RestManager, RestRequestRejection } from '@discordeno/rest';

export interface RequestHandlerOptions {
    queue: DiscordRestChannel;
    discord: RestManager;
}

export function createRequestHandler(options: RequestHandlerOptions): RestManager['makeRequest'] {
    const { queue, discord } = options;
    return async<T>(method: RequestMethods, url: string, options?: MakeRequestOptions): Promise<T> => {
        const path = url.startsWith('/') ? url as `/${string}` : `/${url}` as const;
        const signal = options?.signal;

        const response = await queue.send(
            {
                method,
                url: path,
                ...options
            },
            {
                signal,
                ttl: discord.requestTimeout
            }
        );

        if (response.status < 200 || response.status >= 400) {
            throw discord.createRequestError(new Error(), {
                status: response.status,
                statusText: response.statusText,
                ...response.body as Omit<RestRequestRejection, 'status' | 'statusText'>
            });
        }

        return response.body as T;
    };
}
