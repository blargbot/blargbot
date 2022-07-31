import { parse } from '@blargbot/core/utils';

import { SubtagArgument } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

export class FilterSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'filter',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.' +
                        '\n\n While inside the `code` parameter, none of the following subtags may be used: `' + bbtag.overrides.filter.join(', ') + '`',
                    exampleCode: '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}',
                    exampleOut: '["apples","apple juice"]',
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
