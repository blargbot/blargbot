import { RequestOptions, ResponseMessage } from '../handler';
import { RequestMiddleware } from './RequestMiddleware';

export class DiscordAuthorizationRequestMiddleware implements RequestMiddleware {
    readonly #token: string;

    public constructor(token: string) {
        if (token.length === 0)
            throw new Error('Token is required');

        this.#token = token;
        if (!/^(Bot|Bearer) /i.test(token))
            throw new Error('Token is not valid');

    }

    public invoke(request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage> {
        request.headers['User-Agent'] = 'blargbot-discord (https://github.com/blargbot/blargbot, 1.0.0)';
        request.headers['Authorization'] = this.#token;
        return next();
    }
}
