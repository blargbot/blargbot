import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.map;

@Subtag.id('map')
@Subtag.ctorArgs('arrayTools')
export class MapSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
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

        this.#arrayTools = arrayTools;
    }

    public async * map(context: BBTagScript, varName: string, arrayStr: string, code: SubtagArgument): AsyncIterable<string> {
        const array = await this.#arrayTools.deserializeOrGetIterable(context.runtime, arrayStr) ?? [];
        try {
            for (const item of array) {
                await context.runtime.limit.check('map:loops');
                await context.runtime.variables.set(varName, item);
                yield await code.execute();
            }
        } finally {
            context.runtime.variables.reset([varName]);
        }
    }
}
