import type { SubtagArgumentArray } from '../arguments/index.js';
import type { BBTagCall } from '../BBTagCall.js';
import type { BBTagScript } from '../BBTagScript.js';
import type { BBTagRuntime } from '../index.js';
import type { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class StringSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<string | undefined>>) {
        super();
    }

    protected async getResults(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Promise<string> {
        return await this.logic.execute(context, args, subtag) ?? '';
    }

    public static withConversion<T>(convert: (value: T, runtime: BBTagRuntime) => string): new (logic: SubtagLogic<Awaitable<T>>) => SubtagLogicWrapper {
        return class StringifyFormattedSubtagLogic extends SubtagLogicWrapper {
            public constructor(public readonly logic: SubtagLogic<Awaitable<T>>) {
                super();
            }

            protected async getResults(context: BBTagScript, args: SubtagArgumentArray, subtag: BBTagCall): Promise<string> {
                return convert(await this.logic.execute(context, args, subtag), context.runtime);
            }
        };
    }
}
