import { RequestOptions } from './RequestOptions';
import { ResponseMessage } from './ResponseMessage';

export interface RequestHandler {
    send(request: RequestOptions): Promise<ResponseMessage>;
}
