import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import { Lazy } from '../../utils/Lazy.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.substring;

@Subtag.id('substring')
@Subtag.ctorArgs('converter')
export class SubstringSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', 'start', 'end?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (ctx, [text, start, end]) => this.substring(ctx, text.value, start.value, end.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public substring(context: BBTagScript, text: string, startStr: string, endStr: string): string {
        const fallback = new Lazy(() => this.#converter.int(context.runtime.scopes.local.fallback ?? ''));
        const start = this.#converter.int(startStr) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const end = endStr === '' ? text.length : this.#converter.int(endStr) ?? fallback.value;
        if (end === undefined)
            throw new NotANumberError(endStr);

        return text.substring(start, end);
    }
}
