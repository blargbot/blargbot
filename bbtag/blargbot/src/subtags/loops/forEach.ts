import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.forEach;

@Subtag.id('forEach')
@Subtag.ctorArgs('arrayTools')
export class ForEachSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;

    public constructor(arrayTools: BBTagArrayTools) {
        super({
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

        this.#arrayTools = arrayTools;
    }
    public async * foreach(
        context: BBTagScript,
        varName: string,
        source: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const array = await this.#arrayTools.deserializeOrGetIterable(context.runtime, source) ?? [];
        try {
            for (const item of array) {
                await context.runtime.limit.check('foreach:loops');
                await context.runtime.variables.set(varName, item);
                yield await code.execute();
            }
        } finally {
            context.runtime.variables.reset([varName]);
        }
    }
}
