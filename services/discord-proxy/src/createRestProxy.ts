import * as discordeno from 'discordeno';
import type express from 'express';

import type { RestProxyOptions } from './RestProxyOptions.js';

export default function createRestProxy(options: RestProxyOptions): express.RequestHandler {
    const rest = discordeno.createRestManager({
        token: options.token,
        secretKey: options.secret,
        customUrl: options.url,
        debug: console.debug,
        convertRestError(err, data) {
            return new RestDataError(err, data);
        }
    });

    return ignoreResult(async function handleRestProxyRequest(req: express.Request, res: express.Response): Promise<express.Response> {
        if (options.secret !== req.headers.authorization) {
            console.error(req.method, req.url, 401, 'Secret missing or invalid');
            return res.status(401).json({ code: 40001, message: 'Unauthorized. Provide a valid token and try again' });
        }

        try {
            // FIX: https://github.com/discordeno/discordeno/pull/2593
            reviveBlobs(req.body);
            const result = await rest.runMethod<unknown>(rest, req.method as discordeno.RequestMethod, `${discordeno.BASE_URL}${req.url}`, req.body);
            return result === null || result === undefined
                ? res.status(204).json()
                : res.status(200).json(result);
        } catch (err: unknown) {
            if (!(err instanceof RestDataError)) {
                console.error(req.method, req.url, 500, err);
                return res.status(500).json(err);
            }

            console.error(req.method, req.url, err.data.status, err.data.body);
            return res.status(err.data.status)
                .contentType('application/json')
                .send(err.data.body);
        }
    });
}

class RestDataError extends Error {
    public constructor(
        public readonly innerError: Error,
        public readonly data: discordeno.RestRequestRejection
    ) {
        super(innerError.message);
        this.stack = innerError.stack;
        this.name = innerError.name;
    }
}

function reviveBlobs(body: unknown): void {
    if (!hasProp(body, 'file'))
        return;

    const files = Array.isArray(body.file) ? body.file : [body.file];
    for (const file of files) {
        if (!hasProp(file, 'blob') || typeof file.blob !== 'string')
            continue;
        const match = file.blob.match(/^data:(?<mimeType>[a-zA-Z0-9/]*);(?<encoding>\w+),(?<content>.*)$/);
        if (match?.groups === undefined)
            continue;
        const { mimeType, encoding, content } = match.groups;
        const data = Buffer.from(content, encoding as BufferEncoding);
        file.blob = new Blob([data], { type: mimeType });
    }
}

function hasProp<T extends PropertyKey>(value: unknown, prop: T): value is { [P in T]: unknown } {
    return typeof value === 'object' && value !== null && prop in value;
}

function ignoreResult<This, Args extends readonly unknown[]>(action: (this: This, ...args: Args) => Promise<unknown>): (this: This, ...args: Args) => void {
    const name = action.name;
    return {
        [name](this: This, ...args: Args) {
            void action.call(this, ...args)
                .catch(err => console.error(err));
        }
    }[name];
}
