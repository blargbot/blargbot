import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import { BBTagRuntimeError } from '../errors/index.js';
import { BBTagRuntimeState } from '../types.js';
import type { SubtagLogic } from './SubtagLogic.js';

export abstract class SubtagLogicWrapper implements SubtagLogic {
    public async execute(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Promise<string> {
        try {
            return await this.getResults(context, args, subtag);
        } catch (error: unknown) {
            if (!(error instanceof BBTagRuntimeError))
                throw error;
            return context.runtime.addError(error, subtag.ast);
        }
    }

    protected abstract getResults(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Awaitable<string>;

    protected async* iterate<T>(context: BBTagScript, subtag: BBTagCall, source: Iterable<T> | AsyncIterable<T>): AsyncIterable<T | string> {
        try {
            for await (const item of source) {
                yield item;
                if (context.runtime.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } catch (err: unknown) {
            if (!(err instanceof BBTagRuntimeError))
                throw err;
            yield context.runtime.addError(err, subtag.ast);
        }
    }
}
