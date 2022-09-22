import { RequestOptions, ResponseMessage } from '../handler';
import { RequestMiddleware } from './RequestMiddleware';

export class DefaultRequestTimeoutMiddleware implements RequestMiddleware {
    readonly #timeout: number;

    public constructor(timeout: number) {
        this.#timeout = timeout;
    }

    public invoke(request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage> {
        if (request.abort !== undefined)
            return next();
        return this.#invokeCore(request, next);
    }

    async #invokeCore(request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage> {
        const abort = new AbortController();
        request.abort = abort.signal;
        const timeout = setTimeout(() => abort.abort(new Error('Operation timed out')), this.#timeout);
        try {
            return await next();
        } finally {
            clearTimeout(timeout);
        }
    }
}
