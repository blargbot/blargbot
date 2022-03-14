import { IMiddleware, MiddlewareOptions, NextMiddleware } from '@blargbot/core/types';

export function runMiddleware<Context, Result>(middleware: ReadonlyArray<IMiddleware<Context, Result>>, context: Context, next: NextMiddleware<Result>): Awaitable<Result>;
export function runMiddleware<Context, Result>(middleware: ReadonlyArray<IMiddleware<Context, Result>>, context: Context, options: MiddlewareOptions, terminate: () => Awaitable<Result>): Awaitable<Result>;
export function runMiddleware<Context, Result>(middleware: ReadonlyArray<IMiddleware<Context, Result>>, context: Context, next: MiddlewareOptions | NextMiddleware<Result>, terminate?: () => Awaitable<Result>): Awaitable<Result> {
    let options: NextMiddleware<Result>;
    if (terminate !== undefined)
        options = Object.assign(terminate, next);
    else if (typeof next === 'function')
        options = next;
    else
        throw new Error('terminate must be given if options is not callable');

    const runMiddleware = (context: Context, index: number): Awaitable<Result> => {
        if (index >= middleware.length)
            return options();

        const current = middleware[index];
        const name = current.name === undefined ? current.constructor.name : `${current.constructor.name}(${current.name})`;

        options.logger.debug('[', options.id, ']', name, 'started after', performance.now() - options.start, 'ms');
        let result;
        try {
            result = current.execute(context, Object.assign(() => runMiddleware(context, index + 1), options));
        } finally {
            if (result instanceof Promise)
                result = result.finally(() => logCompletion(name, options));
            else
                logCompletion(name, options);
        }

        return result;
    };

    return runMiddleware(context, 0);
}

function logCompletion(name: string, options: MiddlewareOptions): void {
    options.logger.debug('[', options.id, ']', name, 'completed after', performance.now() - options.start, 'ms');
}
