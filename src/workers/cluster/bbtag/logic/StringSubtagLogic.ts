import { SubtagArgumentArray, SubtagCall, SubtagLogic } from '@cluster/types';

import { BBTagContext } from '../BBTagContext';
import { SubtagLogicWrapper } from './SubtagLogicWrapper';

export class StringSubtagLogic extends SubtagLogicWrapper {
    public constructor(public readonly logic: SubtagLogic<Awaitable<string>>) {
        super();
    }

    protected async getResults(context: BBTagContext, args: SubtagArgumentArray, subtag: SubtagCall): Promise<[string]> {
        return [await this.logic.execute(context, args, subtag)];
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
