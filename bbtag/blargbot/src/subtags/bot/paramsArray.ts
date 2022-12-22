import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

import { BBTagRuntimeError } from '../../errors/BBTagRuntimeError.js';

export class ParamsArraySubtag extends Subtag {
    public constructor() {
        super({
            name: 'paramsArray',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
