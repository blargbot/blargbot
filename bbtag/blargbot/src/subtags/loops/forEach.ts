import type { SubtagArgument } from '../../arguments/index.js';
import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class ForEachSubtag extends Subtag {
    public constructor() {
        super({
            name: 'forEach',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
