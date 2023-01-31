import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.indexOf;

@Subtag.names('indexOf')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.converter())
export class IndexOfSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text|array', 'searchfor', 'start?:0'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (ctx, [text, search, start]) => this.indexOf(ctx, text.value, search.value, start.value)
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public indexOf(context: BBTagContext, text: string, query: string, startStr: string): number {
        const from = this.#converter.int(startStr) ?? this.#converter.int(context.scopes.local.fallback ?? '');
        if (from === undefined)
            throw new NotANumberError(startStr);

        const { v: input } = this.#arrayTools.deserialize(text) ?? { v: text };
        return input.indexOf(query, from);
    }
}