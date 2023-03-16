import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { overrides, SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.filter;

@Subtag.id('filter')
@Subtag.ctorArgs('arrayTools', 'converter')
export class FilterSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description({ disabled: overrides.filter }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]',
                    execute: (ctx, [variable, array, code]) => this.filter(ctx, variable.value, array.value, code)
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public async * filter(context: BBTagScript, varName: string, source: string, code: SubtagArgument): AsyncIterable<JToken> {
        const array = await this.#arrayTools.deserializeOrGetIterable(context.runtime, source) ?? [];
        try {
            for (const item of array) {
                await context.runtime.limit.check('filter:loops');
                await context.runtime.variables.set(varName, item);
                if (this.#converter.boolean((await code.execute()).trim()) === true)
                    yield item;
            }
        } finally {
            context.runtime.variables.reset([varName]);
        }
    }
}
