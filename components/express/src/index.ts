import express from 'express';

export default express;
export {
    Application,
    CookieOptions,
    Errback,
    ErrorRequestHandler,
    Express,
    Handler,
    IRoute,
    IRouter,
    IRouterHandler,
    IRouterMatcher,
    Locals,
    MediaType,
    NextFunction,
    Request,
    RequestHandler,
    RequestParamHandler,
    Response,
    Router,
    RouterOptions,
    Send,
    application,
    json,
    query,
    raw,
    request,
    response,
    static,
    text,
    urlencoded
} from 'express';

export function asyncHandler<
    Request extends express.Request,
    Response extends express.Response,
    Next extends express.NextFunction
>(
    handler: (request: Request, response: Response, next: Next) => Awaitable<void>
): (request: Request, response: Response, next: Next) => void {
    return (...args) => void Promise.resolve(handler(...args)).catch(args[2]);
}
