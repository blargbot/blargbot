import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { createRegex } from '../../utils/createRegex.js';
import type { BBTagValueConverter } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexMatch;

@Subtag.id('regexMatch', 'match')
@Subtag.ctorArgs('converter')
export class RegexMatchSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.ARRAY, //? Why?
            definition: [
                {
                    parameters: ['text', '~regex#50000'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (_, [text, regex]) => this.regexMatch(text.value, regex.raw)
                }
            ]
        });
        this.#converter = converter;
    }

    public regexMatch(text: string, regexStr: string): string[] {
        const regex = createRegex(this.#converter, regexStr);
        const matches = text.match(regex);
        if (matches === null)
            return [];
        return matches;
    }
}
