import zlib from 'zlib';

import { RequestOptions, ResponseMessage } from '../handler';
import { RequestMiddleware } from './RequestMiddleware';

export class ResponseCompressionRequestMiddleware implements RequestMiddleware {
    static readonly #encodings = {
        'gzip': () => zlib.createGunzip(),
        'deflate': () => zlib.createInflate()
    };

    public async invoke(request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage> {
        const currentEncoding = request.headers['Accept-Encoding'] ??= [];
        const acceptEncoding = request.headers['Accept-Encoding'] = Array.isArray(currentEncoding) ? currentEncoding : [currentEncoding.toString()];
        acceptEncoding.push(...Object.keys(ResponseCompressionRequestMiddleware.#encodings));

        const response = await next();

        const encoding = response.headers['content-encoding'];
        if (encoding !== undefined) {
            for (const [name, transform] of Object.entries(ResponseCompressionRequestMiddleware.#encodings)) {
                if (encoding.includes(name)) {
                    response.body = response.body.pipe(transform());
                    return response;
                }
            }
        }

        return response;
    }

}
