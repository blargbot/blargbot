import { Subtag } from '@bbtag/subtag';

import type { SubtagArgument } from '../../arguments/index.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class MapSubtag extends Subtag {
    public constructor() {
        super({
            name: 'map',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (context, [varName, array, code]) => this.map(context, varName.value, array.value, code)
                }
            ]
        });
    }

    public async * map(context: BBTagContext, varName: string, arrayStr: string, code: SubtagArgument): AsyncIterable<string> {
        const array = await bbtag.tagArray.deserializeOrGetIterable(context, arrayStr) ?? [];
        try {
            for (const item of array) {
                await context.limit.check(context, 'map:loops');
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
