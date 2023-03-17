import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { createRegex } from '../../utils/createRegex.js';
import type { BBTagValueConverter } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexTest;

@Subtag.id('regexTest')
@Subtag.ctorArgs('converter')
export class RegexTestSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'boolean',
                    execute: (_, [text, regex]) => this.regexTest(text.value, regex.raw)
                }
            ]
        });
        this.#converter = converter;
    }

    public regexTest(text: string, regexStr: string): boolean {
        const regex = createRegex(this.#converter, regexStr);
        return regex.test(text);
    }
}
