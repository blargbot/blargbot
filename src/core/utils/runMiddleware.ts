import { IMiddleware, MiddlewareOptions, NextMiddleware } from '@blargbot/core/types';
import { performance } from 'perf_hooks';

const mw: unique symbol = Symbol();

export type MethodMiddleware<Target, Method extends keyof Target> = Target extends { [P in Method]: (...args: infer Args) => infer Result }
    ? (this: Target, args: Args, next: () => Result) => Result
    : never;

type MiddlewareFunc<Target, Method extends keyof Target> = Target[Method] extends (this: Target, ...args: infer Args) => infer Result
    ? ((this: Target, ...args: Args) => Result) & { [mw]: Array<MethodMiddleware<Target, Method>>; }
    : never;

type WithMiddleware<Target, Method extends keyof Target> =
    & Target
    & { [P in Method]: MiddlewareFunc<Target, Method> };

function isMethodMiddleware<Target, Method extends keyof Target>(target: Target, method: Method): target is WithMiddleware<Target, Method> {
    return typeof target[method] === 'function' && mw in target[method];
}

export function addMiddleware<Target, Method extends keyof Target>(
    target: Target,
    method: Method,
    middleware: MethodMiddleware<Target, Method>
): void {
    if (isMethodMiddleware(target, method)) {
        target[method][mw].push(middleware);
        return;
    }

    const func = target[method] as unknown as MiddlewareFunc<Target, Method>;
    const middlewares: Array<MethodMiddleware<Target, Method>> = [];
    function runMiddleware(args: unknown[], index: number): unknown {
        if (index >= middlewares.length)
            return func.call(target, ...args);
        return middlewares[index].call(target, args, () => runMiddleware(args, index + 1));
    }
    target[method] = Object.defineProperty(Object.assign((...args: Parameters<typeof func>) => runMiddleware(args, 0), func), mw, {
        configurable: false,
        enumerable: false,
        writable: false,
        value: middlewares
    }) as unknown as Target[Method];
}

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

        options.logger.middleware('[', options.id, ']', name, 'started after', performance.now() - options.start, 'ms');
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
    options.logger.middleware('[', options.id, ']', name, 'completed after', performance.now() - options.start, 'ms');
}
