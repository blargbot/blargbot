import { SubtagArgumentArray, SubtagCall, SubtagLogic, SubtagResult } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { BBTagRuntimeError } from '../errors';

export abstract class SubtagLogicWrapper implements SubtagLogic<SubtagResult> {
    public async *execute(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): SubtagResult {
        try {
            yield* await this.getResults(context, args, subtag);
        } catch (error: unknown) {
            if (!(error instanceof BBTagRuntimeError))
                throw error;
            context.addError(error, subtag);
            yield* await this.formatError(error, context.scopes.local.fallback);
        }
    }

    protected abstract getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Awaitable<SubtagResult | Iterable<string | undefined>>;
    protected formatError(error: BBTagRuntimeError, fallback: string | undefined): Awaitable<SubtagResult | Iterable<string | undefined>> {
        return [fallback ?? error.bberror];
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    protected async *toAsyncIterable<T>(source: AsyncIterable<T> | Iterable<T>): AsyncGenerator<T, void, undefined> {
        yield* source;
    }
}
