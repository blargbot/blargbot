import { RequestOptions, ResponseMessage } from '../handler';
import { RatelimitBucketManager } from '../ratelimit';
import { RequestMiddleware } from './RequestMiddleware';

export class RatelimitRequestMiddleware implements RequestMiddleware {
    readonly #buckets: RatelimitBucketManager;

    public constructor(buckets?: RatelimitBucketManager) {
        this.#buckets = buckets ?? new RatelimitBucketManager();
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

            bucket = this.#buckets.readHeaders(request.id, response.headers);
            bucket.release();

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
}
