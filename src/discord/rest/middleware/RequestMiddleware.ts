import { RequestOptions, ResponseMessage } from '../handler';

export interface RequestMiddleware {
    invoke(request: RequestOptions, next: () => Promise<ResponseMessage>): Promise<ResponseMessage>;
}
