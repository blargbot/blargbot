import { SubtagArgument } from '../../arguments';
import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.foreach;

export class ForeachSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'foreach',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: 'For every element in `array`, a variable called `variable` will be set and then `code` will be run.\nIf `element` is not an array, it will iterate over each character intead.',
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
