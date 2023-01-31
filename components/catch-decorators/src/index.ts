const errorHandlerMap: unique symbol = Symbol('ErrorHandlerMap');
const asyncErrorHandlerMap: unique symbol = Symbol('AsyncErrorHandlerMap');

export type CatchErrorsDecorator<ErrorResult> = <Args extends readonly unknown[], Success>(target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<(...args: Args) => Success | ErrorResult>) => TypedPropertyDescriptor<(...args: Args) => Success | ErrorResult>;
export type AsyncCatchErrorsDecorator<ErrorResult> = <Args extends readonly unknown[], Success>(target: object, key: PropertyKey, descriptor: TypedPropertyDescriptor<(...args: Args) => Promise<Success | ErrorResult>>) => TypedPropertyDescriptor<(...args: Args) => Promise<Success | ErrorResult>>;
export interface CatchErrorsDecoratorFactory {
    <Error, ErrorResult>(
        type: abstract new (...args: never) => Error,
        handle: (error: Error) => ErrorResult
    ): CatchErrorsDecorator<ErrorResult>;

    filtered<Error, ErrorResult>(
        filter: (error: unknown) => error is Error,
        handle: (error: Error) => ErrorResult
    ): CatchErrorsDecorator<ErrorResult>;

    async: AsyncCatchErrorsDecoratorFactory;
}
export interface AsyncCatchErrorsDecoratorFactory {
    <Error, ErrorResult>(
        type: abstract new (...args: never) => Error,
        handle: (error: Error) => ErrorResult
    ): AsyncCatchErrorsDecorator<ErrorResult>;

    filtered<Error, ErrorResult>(
        filter: (error: unknown) => error is Error,
        handle: (error: Error) => ErrorResult
    ): AsyncCatchErrorsDecorator<ErrorResult>;
}

export const catchErrors: CatchErrorsDecoratorFactory = Object.assign(createCatchErrorsDecorator, {
    filtered: createCatchFilteredErrorsDecorator,
    async: Object.assign(createCatchAsyncErrorsDecorator, {
        filtered: createCatchAsyncFilteredErrorsDecorator
    })
});

function createCatchFilteredErrorsDecorator<Error, Result>(
    filter: (error: unknown) => error is Error,
    handle: (error: Error) => Result
): CatchErrorsDecorator<Result> {
    return (_, __, descriptor) => {
        if (descriptor.value === undefined)
            throw new Error('No function implementation');

        const impl = hasErrorHandlerConfig(descriptor.value)
            ? descriptor.value
            : descriptor.value = createErrorCatchingFunction(descriptor.value);
        impl[errorHandlerMap].set(filter, handle);
        return descriptor;
    };
}

function createCatchAsyncFilteredErrorsDecorator<Error, Result>(
    filter: (error: unknown) => error is Error,
    handle: (error: Error) => Awaitable<Result>
): AsyncCatchErrorsDecorator<Result> {
    return (_, __, descriptor) => {
        if (descriptor.value === undefined)
            throw new Error('No function implementation');

        const impl = hasAsyncErrorHandlerConfig(descriptor.value)
            ? descriptor.value
            : descriptor.value = createAsyncErrorCatchingFunction(descriptor.value);
        impl[asyncErrorHandlerMap].set(filter, handle);
        return descriptor;
    };
}

function createCatchErrorsDecorator<Error, Result>(
    type: abstract new (...args: never) => Error,
    handle: (error: Error) => Result
): CatchErrorsDecorator<Result> {
    return createCatchFilteredErrorsDecorator((err): err is Error => err instanceof type, handle);
}

function createCatchAsyncErrorsDecorator<Error, Result>(
    type: abstract new (...args: never) => Error,
    handle: (error: Error) => Awaitable<Result>
): AsyncCatchErrorsDecorator<Result> {
    return createCatchAsyncFilteredErrorsDecorator((err): err is Error => err instanceof type, handle);
}

function createErrorCatchingFunction<Args extends readonly unknown[], Result>(impl: (...args: Args) => Result): ErrorHandlingFunction<Args, Result> {
    const handlers = new Map<(value: unknown) => boolean, (value: unknown) => Result>();
    function handleError(error: unknown): Result {
        for (const [test, handle] of handlers) {
            if (test(error))
                return handle(error);
        }
        throw error;
    }

    return Object.assign((...args: Args): Result => {
        try {
            return impl(...args);
        } catch (error) {
            return handleError(error);
        }
    }, {
        [errorHandlerMap]: handlers as ErrorHandlingFunction<Args, Result>[typeof errorHandlerMap]
    });
}

function createAsyncErrorCatchingFunction<Args extends readonly unknown[], Result>(impl: (...args: Args) => Promise<Result>): AsyncErrorHandlingFunction<Args, Result> {
    const handlers = new Map<(value: unknown) => boolean, (value: unknown) => Awaitable<Result>>();
    async function handleError(error: unknown): Promise<Result> {
        for (const [test, handle] of handlers) {
            if (test(error))
                return await handle(error);
        }
        throw error;
    }

    return Object.assign(async (...args: Args): Promise<Result> => {
        try {
            return await impl(...args);
        } catch (error) {
            return await handleError(error);
        }
    }, {
        [asyncErrorHandlerMap]: handlers as AsyncErrorHandlingFunction<Args, Result>[typeof asyncErrorHandlerMap]
    });
}

function hasErrorHandlerConfig<Args extends readonly unknown[], Result>(x: (...args: Args) => Result): x is ErrorHandlingFunction<Args, Result> {
    return errorHandlerMap in x && x[errorHandlerMap] instanceof Map;
}

function hasAsyncErrorHandlerConfig<Args extends readonly unknown[], Result>(x: (...args: Args) => Awaitable<Result>): x is AsyncErrorHandlingFunction<Args, Result> {
    return asyncErrorHandlerMap in x && x[asyncErrorHandlerMap] instanceof Map;
}

interface ErrorHandlingFunction<Args extends readonly unknown[], Result> {
    (...args: Args): Result;
    [errorHandlerMap]: {
        set<Error>(
            test: (error: unknown) => error is Error,
            handle: (error: Error) => Result
        ): void;
    };
}

interface AsyncErrorHandlingFunction<Args extends readonly unknown[], Result> {
    (...args: Args): Promise<Result>;
    [asyncErrorHandlerMap]: {
        set<Error>(
            test: (error: unknown) => error is Error,
            handle: (error: Error) => Awaitable<Result>
        ): void;
    };
}
