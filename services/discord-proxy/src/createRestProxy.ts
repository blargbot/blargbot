import type express from '@blargbot/express';
import { asyncHandler } from '@blargbot/express';
import * as discordeno from 'discordeno';

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

    return asyncHandler(async (req, res) => {
        if (options.secret !== req.headers.authorization) {
            console.error(req.method, req.url, 401, 'Secret missing or invalid');
            return void res.status(401).json({ code: 40001, message: 'Unauthorized. Provide a valid token and try again' });
        }

        try {
            const result = await rest.runMethod<unknown>(rest, req.method as discordeno.RequestMethod, `${discordeno.BASE_URL}${req.url}`, req.body);
            return result === null || result === undefined
                ? void res.status(204).json()
                : void res.status(200).json(result);
        } catch (err: unknown) {
            if (!(err instanceof RestDataError)) {
                console.error(req.method, req.url, 500, err);
                return void res.status(500).json(err);
            }

            console.error(req.method, req.url, err.data.status, err.data.body);
            return void res.status(err.data.status)
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
