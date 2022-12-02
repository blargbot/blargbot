import { SubtagArgumentArray } from '../arguments/index.js';
import { BBTagContext } from '../BBTagContext.js';
import { SubtagCall } from '../language/index.js';
import { SubtagLogic } from './SubtagLogic.js';
import { SubtagLogicWrapper } from './SubtagLogicWrapper.js';

export class StringSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<string | undefined>>) {
        super();
    }

    protected async getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Promise<[string] | []> {
        const value = await this.logic.execute(context, args, subtag);
        return typeof value === 'string' ? [value] : [];
    }

    public static withConversion<T>(convert: (value: T) => string): new (logic: SubtagLogic<Awaitable<T>>) => SubtagLogicWrapper {
        return class StringifyFormattedSubtagLogic extends SubtagLogicWrapper {
            public constructor(public readonly logic: SubtagLogic<Awaitable<T>>) {
                super();
            }

            protected async getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Promise<[string]> {
                return [convert(await this.logic.execute(context, args, subtag))];
            }
        };
    }
}
