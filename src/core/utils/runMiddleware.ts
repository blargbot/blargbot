import { IMiddleware } from '@core/types';

export function runMiddleware<Context, Result>(middleware: ReadonlyArray<IMiddleware<Context, Result>>, context: Context, fallback: Result, terminate: (context: Context) => boolean = () => false): Awaitable<Result> {
    const runMiddleware = (context: Context, index: number): Awaitable<Result> => {
        if (index >= middleware.length || terminate(context))
            return fallback;

        return middleware[index].execute(context, newContext => runMiddleware(newContext ?? context, index + 1));
    };

    return runMiddleware(context, 0);
}
