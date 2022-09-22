import http from 'http';

import { RatelimitManager } from '../../ratelimit';
import { RequestOptions, ResponseMessage } from '../handler';
import { RequestMiddleware } from './RequestMiddleware';

export class RatelimitRequestMiddleware implements RequestMiddleware {
    readonly #buckets: RatelimitManager;

    public constructor(buckets?: RatelimitManager) {
        this.#buckets = buckets ?? new RatelimitManager();
    }

    public async invoke(request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage> {
        let bucket = this.#buckets.get(request.id);
        do {
            await bucket.wait(request.abort);
            let response: ResponseMessage;
            try {
                response = await next();
            } catch (err: unknown) {
                bucket.release();
                throw err;
            }

            const newId = this.#getHeader(response.headers, 'x-ratelimit-bucket');
            const limit = this.#getHeader(response.headers, 'x-ratelimit-limit', parseFloat);
            const remaining = this.#getHeader(response.headers, 'x-ratelimit-remaining', parseFloat);
            const disableFor = this.#getHeader(response.headers, 'x-ratelimit-global') === 'true' ? this.#getHeader(response.headers, 'retry-after', v => parseFloat(v) * 1000) : undefined;
            const resetAfter = this.#getHeader(response.headers, 'x-ratelimit-reset-after', v => parseFloat(v) * 1000);

            bucket = this.#buckets.update(request.id, newId, disableFor, limit, remaining, resetAfter);

            if (response.statusCode !== 429)
                return response;

            const retryAfterHeader = response.headers['retry-after'];
            if (retryAfterHeader !== undefined) {
                const retryAfter = parseFloat(retryAfterHeader) * 1000;
                await new Promise(res => setTimeout(res, retryAfter));
            }
            // eslint-disable-next-line no-constant-condition
        } while (true);
    }

    #getHeader(headers: http.IncomingHttpHeaders, header: string): string | undefined;
    #getHeader<T>(headers: http.IncomingHttpHeaders, header: string, transform: (value: string) => T): T | undefined;
    #getHeader(headers: http.IncomingHttpHeaders, header: string, transform: (value: string) => unknown = s => s): unknown {
        const value = headers[header];
        switch (typeof value) {
            case 'string': return transform(value);
            case 'object': return transform(value[0]);
            case 'undefined': return undefined;
        }
    }
}
