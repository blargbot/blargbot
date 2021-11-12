import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { SubtagArgument } from '@cluster/types';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ForeachSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'foreach',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and then `code` will be run.\n' +
                        'If `element` is not an array, it will iterate over each character intead.',
                    exampleCode: '{set;~array;apples;oranges;c#}\n{foreach;~element;~array;I like {get;~element}{newline}}',
                    exampleOut: 'I like apples\nI like oranges\nI like c#',
                    returns: 'loop',
                    execute: (context, [variable, array, code]) => this.foreach(context, variable.value, array.value, code)
                }
            ]
        });
    }
    public async * foreach(
        context: BBTagContext,
        varName: string,
        array: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const arr = await bbtagUtil.tagArray.getArray(context, array) ?? { v: array.split('') };
        try {
            for (const item of arr.v) {
                await context.limit.check(context, 'filter:loops');
                await context.variables.set(varName, item);
                yield await code.execute();

                if (context.state.return !== 0)
                    break;
            }
        } finally {
            await context.variables.reset(varName);
        }
    }
}
