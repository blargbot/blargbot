import { BBTagContext } from '../../BBTagContext';
import { DefinedSubtag } from '../../DefinedSubtag';
import { BBTagRuntimeError } from '../../errors';
import { SubtagType } from '../../utils';

export class ParamsArraySubtag extends DefinedSubtag {
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
                    returns: 'json[]',
                    execute: (ctx) => this.getParamsArray(ctx)
                }
            ]
        });
    }

    public getParamsArray(context: BBTagContext): readonly string[] {
        const params = context.scopes.local.paramsarray;
        if (params === undefined)
            throw new BBTagRuntimeError('{paramsarray} can only be used inside {function}');
        return params;
    }
}
