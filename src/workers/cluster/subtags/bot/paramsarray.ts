import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class ParamsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'paramsarray',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the parameters passed to the current function as an array',
                    exampleCode: '{func.test;{paramsarray}}\n{func.test;a;b;c;d}',
                    exampleOut: '["a","b","c","d"]',
                    execute: (ctx, _, subtag) => this.getParamsArray(ctx, subtag)
                }
            ]
        });
    }

    public getParamsArray(context: BBTagContext, subtag: SubtagCall): string {
        const params = context.scope.paramsarray;
        if (params === undefined)
            return context.addError('{paramsarray} can only be used inside {function}', subtag);
        return JSON.stringify(params);
    }
}
