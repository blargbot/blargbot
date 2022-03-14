import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { BBTagRuntimeState, SubtagArgument } from '@blargbot/cluster/types';
import { bbtag, SubtagType } from '@blargbot/cluster/utils';

export class ForeachSubtag extends DefinedSubtag {
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
        source: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const array = await bbtag.tagArray.deserializeOrGetIterable(context, source) ?? [];
        try {
            for (const item of array) {
                await context.limit.check(context, 'foreach:loops');
                await context.variables.set(varName, item);
                yield await code.execute();

                if (context.data.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            context.variables.reset([varName]);
        }
    }
}
