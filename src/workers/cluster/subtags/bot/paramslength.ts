import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { BBTagRuntimeError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class ParamsLengthSubtag extends DefinedSubtag {
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
                    returns: 'number',
                    execute: (ctx) => this.getParamsLength(ctx)
                }
            ]
        });
    }

    public getParamsLength(context: BBTagContext): number {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{paramslength} can only be used inside {function}');
        return params.length;
    }
}
