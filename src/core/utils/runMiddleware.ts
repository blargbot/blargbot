import { IMiddleware, MiddlewareRunOptions } from '@core/types';
import moment from 'moment';

export function runMiddleware<Context, Result>(
    middlewareOrder: ReadonlyArray<IMiddleware<Context, Result>>,
    context: Context,
    fallback: Result,
    options: MiddlewareRunOptions
): Awaitable<Result> {
    const runMiddleware = (context: Context, index: number): Awaitable<Result> => {
        if (index >= middlewareOrder.length)
            return fallback;

        const middleware = middlewareOrder[index];
        const name = middleware.name === undefined ? middleware.constructor.name : `${middleware.constructor.name}(${middleware.name})`;

        options.logger.debug('[', options.id, ']', name, 'started after', moment().diff(options.start), 'ms');
        const result = middleware.execute(context, () => runMiddleware(context, index + 1), options);

        if (result instanceof Promise)
            void result.finally(() => options.logger.debug('[', options.id, ']', name, 'completed after', moment().diff(options.start), 'ms'));
        else
            options.logger.debug('[', options.id, ']', name, 'completed after', moment().diff(options.start), 'ms');

        return result;
    };

    return runMiddleware(context, 0);
}
