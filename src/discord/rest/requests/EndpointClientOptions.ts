import { RequestHandler } from '../handler';

export interface EndpointClientOptions {
    readonly requestHandler: RequestHandler;
}
