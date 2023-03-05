import * as http from 'node:http';

import type Discord from '@blargbot/discord-types';

export class CurrentUserAccessor implements ICurrentUserAccessor {
    readonly #userCacheUrl: string;
    readonly #retryInterval: number;
    readonly #refreshInterval: number;

    #value?: Discord.APIUser;
    #promise?: Promise<Discord.APIUser>;
    #lastLoad: number;

    public constructor(options: CurrentUserAccessorOptions) {
        this.#userCacheUrl = options.userCacheUrl;
        this.#retryInterval = options.retryInterval ?? 1000;
        this.#refreshInterval = options.refreshInterval ?? 60000;
        this.#lastLoad = 0;
    }

    public getOrWait(): Awaitable<Discord.APIUser> {
        if (!this.#shouldReload())
            return this.#value ?? (this.#promise ??= this.#load());

        this.#promise ??= this.#load();
        return this.#value ?? this.#promise;
    }

    public get(): Discord.APIUser {
        if (this.#value === undefined)
            throw new Error('No API user has been retrieved yet!');
        return this.#value;
    }

    #shouldReload(): boolean {
        return this.#lastLoad + this.#refreshInterval < Date.now();
    }

    async #load(): Promise<Discord.APIUser> {
        try {
            const result = this.#value = await this.#retryRequest();
            this.#lastLoad = Date.now();
            return result;
        } finally {
            this.#promise = undefined;
        }
    }

    async #retryRequest(): Promise<Discord.APIUser> {
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const result = await this.#request();
            if (result !== undefined)
                return result;

            await new Promise(res => setTimeout(res, this.#retryInterval));
        }
    }

    async #request(): Promise<Discord.APIUser | undefined> {
        const [req, pres] = makeRequestResponse(new URL('@self', this.#userCacheUrl), { method: 'GET' });
        req.end();
        const res = await pres;
        const data = await readResponse(res);
        if (res.statusCode !== 200)
            return undefined;

        return JSON.parse(data.toString('utf8')) as unknown as Discord.APIUser;
    }
}

export interface CurrentUserAccessorOptions {
    readonly userCacheUrl: string;
    readonly retryInterval?: number;
    readonly refreshInterval?: number;
}

export interface ICurrentUserAccessor {
    getOrWait(): Awaitable<Discord.APIUser>;
    get(): Discord.APIUser;
}

function makeRequestResponse(
    url: string | URL,
    options: http.RequestOptions
): [http.ClientRequest, Promise<http.IncomingMessage>] {
    let request: http.ClientRequest;
    const response = new Promise<http.IncomingMessage>((res, rej) => {
        request = http.request(url, options, res);
        request.on('error', rej);
    });

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return [request!, response];
}

async function readResponse(response: http.IncomingMessage): Promise<Buffer> {
    try {
        return await new Promise<Buffer>((res, rej) => {
            const chunks: Uint8Array[] = [];
            response.on('data', c => chunks.push(c as Uint8Array));
            response.on('end', () => {
                if (response.complete)
                    res(Buffer.concat(chunks));
                else
                    rej(new Error('The connection was terminated while the message was still being sent'));
            });
            response.on('error', rej);
        });
    } catch (err) {
        if (err instanceof Error)
            Error.captureStackTrace(err);
        throw err;
    }
}
