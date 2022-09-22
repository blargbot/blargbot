import http from 'http';
import https from 'https';
import path from 'path';
import stream from 'stream';

import { RequestMiddleware } from '../middleware';
import { RequestHandler } from './RequestHandler';
import { RequestOptions } from './RequestOptions';
import { ResponseMessage } from './ResponseMessage';

export class MiddlewareRequestHandler implements RequestHandler {
    readonly #middleware: RequestMiddleware[];
    readonly #baseUrl: URL;

    public constructor(baseUrl: string, middleware: Iterable<RequestMiddleware>) {
        this.#middleware = [...middleware].reverse();
        this.#baseUrl = new URL(baseUrl);
    }

    public async send(request: RequestOptions): Promise<ResponseMessage> {
        return await this.#middleware.reduce(
            (p, c) => c.invoke.bind(c, request, p),
            this.#sendCore.bind(this, request)
        )();
    }

    async #sendCore(options: RequestOptions): Promise<ResponseMessage> {
        const request = https.request({
            signal: options.abort,
            method: options.method,
            host: this.#baseUrl.host,
            path: path.join(this.#baseUrl.pathname, options.endpoint),
            headers: options.headers
        });
        const response = new Promise<{ success: true; message: http.IncomingMessage; } | { success: false; error: unknown; }>(res => {
            request.once('response', msg => res({ success: true, message: msg }));
            request.once('abort', () => res({ success: false, error: 'Request was aborted.' }));
            request.once('error', err => {
                res({ success: false, error: err });
                request.destroy();
            });
        });

        const details = [];
        const intercept = new stream.PassThrough();
        intercept.on('data', chunk => details.push(chunk));
        intercept.pipe(request);
        await options.write(intercept);
        request.end();

        const result = await response;

        if (result.success) {
            return {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                statusCode: result.message.statusCode!,
                headers: result.message.headers,
                body: result.message
            };
        }
        if (typeof result.error === 'string')
            throw new Error(result.error);
        if (result.error instanceof Error)
            Error.captureStackTrace(result.error);
        throw result.error;
    }
}
