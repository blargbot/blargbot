import type { SubtagCall } from '@bbtag/language';

import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagContext } from '../BBTagContext.js';
import { BBTagRuntimeError } from '../errors/index.js';
import type { SubtagLogic } from './SubtagLogic.js';

export abstract class SubtagLogicWrapper implements SubtagLogic {
    public async *execute(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): AsyncIterable<string | undefined> {
        try {
            yield* await this.getResults(context, args, subtag);
        } catch (error: unknown) {
            if (!(error instanceof BBTagRuntimeError))
                throw error;
            yield context.addError(error, subtag);
        }
    }

    protected abstract getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Awaitable<AsyncIterable<string | undefined> | Iterable<string | undefined>>;

    protected async *toAsyncIterable<T>(source: AsyncIterable<T> | Iterable<T>): AsyncGenerator<T, void, undefined> {
        yield* source;
    }

    protected isIterable(value: unknown): value is Iterable<unknown> | AsyncIterable<unknown> {
        switch (typeof value) {
            case 'object':
                if (value === null)
                    return false;
                return Symbol.iterator in value || Symbol.asyncIterator in value;
            case 'string':
                return true;
            default:
                return false;
        }
    }
}
