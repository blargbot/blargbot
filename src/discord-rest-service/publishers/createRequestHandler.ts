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
        using timeout = makeTimeout(discord.requestTimeout);

        const response = await queue.send({
            method,
            url: path,
            ...options
        }, signal === undefined ? timeout : AbortSignal.any([signal, timeout]));

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

function makeTimeout(timeout: number): TimeoutSignal {
    if (timeout <= 0)
        return neverAbort;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(new Error(`Request timed out after ${timeout}ms`)), timeout);
    return Object.assign(controller.signal, {
        [Symbol.dispose]() {
            clearTimeout(id);
        }
    });

}

interface TimeoutSignal extends Disposable, AbortSignal {
}

const neverAbort: TimeoutSignal = Object.assign(new AbortController().signal, {
    addEventListener: () => { },
    dispatchEvent: () => false,
    removeEventListener: () => { },
    throwIfAborted: () => { },
    [Symbol.dispose]() { }
});
