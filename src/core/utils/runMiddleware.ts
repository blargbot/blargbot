import { IMiddleware } from '@core/types';

export async function runMiddleware<Context, Result>(middleware: ReadonlyArray<IMiddleware<Context, Result>>, context: Context, fallback: Result, terminate: (context: Context) => Awaitable<boolean> = () => false): Promise<Result> {
    const runMiddleware = async (context: Context, index: number): Promise<Result> => {
        if (index >= middleware.length || await terminate(context))
            return fallback;

        return await middleware[index].execute(context, newContext => runMiddleware(newContext ?? context, index + 1));
    };

    return await runMiddleware(context, 0);
}
