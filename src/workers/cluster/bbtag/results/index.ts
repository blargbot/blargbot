import { SubtagCall } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError } from '../errors';

export abstract class SubtagResult {
    public async * execute(context: BBTagContext, subtag: SubtagCall): AsyncIterable<string | undefined> {
        try {
            yield* await this.getResults();
        } catch (error: unknown) {
            if (!(error instanceof BBTagRuntimeError))
                throw error;
            context.addError(error, subtag);
            yield* await this.formatError(error, context.scopes.local.fallback);
        }
    }

    protected abstract getResults(): Awaitable<AsyncIterable<string | undefined> | Iterable<string | undefined>>;
    protected formatError(error: BBTagRuntimeError, fallback: string | undefined): Awaitable<AsyncIterable<string | undefined> | Iterable<string | undefined>> {
        return [fallback ?? error.bberror];
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    protected async * toAsyncIterable<T>(source: AsyncIterable<T> | Iterable<T>): AsyncGenerator<T, void, undefined> {
        yield* source;
    }
}

export class IgnoreSubtagResult<T> extends SubtagResult {
    public constructor(public readonly value: Awaitable<T>) {
        super();
    }

    protected async getResults(): Promise<[]> {
        await this.value;
        return [];
    }
}

export class StringifySubtagResult<T extends { toString(): string; }> extends SubtagResult {
    public constructor(public readonly value: Awaitable<T>) {
        super();
    }

    protected async getResults(): Promise<[string]> {
        return [(await this.value).toString()];
    }
}

export class StringSubtagResult extends SubtagResult {
    public constructor(public readonly value: Awaitable<string>) {
        super();
    }

    protected async getResults(): Promise<[string]> {
        return [await this.value];
    }
}

export class StringifyIterableSubtagResult<T extends { toString(): string; }> extends SubtagResult {
    public constructor(public readonly values: Awaitable<AsyncIterable<T> | Iterable<T>>) {
        super();
    }

    protected async * getResults(): AsyncIterable<string> {
        for await (const item of this.toAsyncIterable(await this.values))
            yield item.toString();
    }
}

export class StringIterableSubtagResult extends SubtagResult {
    public constructor(public readonly values: Awaitable<AsyncIterable<string> | Iterable<string>>) {
        super();
    }

    protected async * getResults(): AsyncIterable<string> {
        for await (const item of this.toAsyncIterable(await this.values))
            yield item;
    }
}

export class ArrayWithErrorsSubtagResult extends SubtagResult {
    public constructor(
        public readonly values: Awaitable<AsyncIterable<JToken> | Iterable<JToken>>
    ) {
        super();
    }

    protected async * getResults(): AsyncIterable<string> {
        const values = await this.values;
        if (Array.isArray(values))
            return yield JSON.stringify(values);

        yield '[';
        for await (const item of this.toAsyncIterable(values))
            yield JSON.stringify(item);
        yield ']';
    }

    protected formatError(error: BBTagRuntimeError, fallback: string | undefined): Iterable<string> {
        return [fallback ?? JSON.stringify(error.bberror), ']'];
    }
}

export class ArraySubtagResult extends SubtagResult {
    public constructor(
        public readonly values: Awaitable<AsyncIterable<JToken> | Iterable<JToken>>
    ) {
        super();
    }

    protected async * getResults(): AsyncIterable<string | undefined> {
        const values = await this.values;
        if (Array.isArray(values))
            return yield JSON.stringify(values);

        const result = [];
        for await (const item of this.toAsyncIterable(values)) {
            yield undefined;
            result.push(item);
        }

        yield JSON.stringify(result);
    }
}
