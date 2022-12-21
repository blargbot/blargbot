import { parse } from '@blargbot/core/utils/index.js';

import type { SubtagArgument } from '../../arguments/index.js';
import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class FilterSubtag extends Subtag {
    public constructor() {
        super({
            name: 'filter',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description({ disabled: bbtag.overrides.filter }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]',
                    execute: (ctx, [variable, array, code]) => this.filter(ctx, variable.value, array.value, code)
                }
            ]
        });
    }

    public async * filter(context: BBTagContext, varName: string, source: string, code: SubtagArgument): AsyncIterable<JToken> {
        const array = await bbtag.tagArray.deserializeOrGetIterable(context, source) ?? [];
        try {
            for (const item of array) {
                await context.limit.check(context, 'filter:loops');
                await context.variables.set(varName, item);
                if (parse.boolean((await code.execute()).trim()) === true)
                    yield item;

                if (context.data.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            context.variables.reset([varName]);
        }
    }
}
