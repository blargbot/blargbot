import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagArgument } from '@cluster/types';
import { bbtagUtil, overrides, parse, SubtagType } from '@cluster/utils';

export class FilterSubtag extends Subtag {
    public constructor() {
        super({
            name: 'filter',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and `code` will be executed. Returns a new array containing all the elements that returned the value `true`.' +
                        '\n\n While inside the `code` parameter, none of the following subtags may be used: `' + overrides.filter.join(', ') + '`',
                    exampleCode: '{set;~array;apples;apple juice;grapefruit}\n{filter;~element;~array;{bool;{get;~element};startswith;apple}}',
                    exampleOut: '["apples","apple juice"]',
                    returns: 'array',
                    execute: (ctx, [variable, array, code]) => this.filter(ctx, variable.value, array.value, code)
                }
            ]
        });
    }

    public async * filter(context: BBTagContext, varName: string, arrayStr: string, code: SubtagArgument): AsyncIterable<JToken> {
        const arr = await bbtagUtil.tagArray.getArray(context, arrayStr) ?? { v: arrayStr.split('') };
        try {
            for (const item of arr.v) {
                await context.limit.check(context, 'filter:loops');
                await context.variables.set(varName, item);
                const res = await code.execute();
                if (context.state.return !== 0)
                    break;

                if (parse.boolean(res) === true)
                    yield item;

            }
        } finally {
            await context.variables.reset(varName);
        }
    }
}
