import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagCall } from '@cluster/types';
import { SubtagType } from '@cluster/utils';

export class ParamsLengthSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'paramslength',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: 'Gets the number of parameters passed to the current function',
                    exampleCode: '{func.test;{paramslength}}\n{func.test;a;b;c;d}',
                    exampleOut: '["a","b","c","d"]',
                    execute: (ctx, _, subtag) => this.getParamsLength(ctx, subtag)
                }
            ]
        });
    }

    public getParamsLength(context: BBTagContext, subtag: SubtagCall): string {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            return context.addError('{paramslength} can only be used inside {function}', subtag);
        return params.length.toString();
    }
}
