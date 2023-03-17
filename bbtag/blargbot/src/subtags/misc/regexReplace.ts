import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { createRegex } from '../../utils/createRegex.js';
import type { BBTagValueConverter } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexReplace;

@Subtag.id('regexReplace')
@Subtag.ctorArgs('converter')
export class RegexReplaceSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            description: tag.description,
            definition: [
                {
                    parameters: ['~regex#50000', 'replaceWith'],
                    description: tag.output.description,
                    exampleCode: tag.output.exampleCode,
                    exampleOut: tag.output.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [regex, replaceWith]) => this.setOutputReplacement(ctx, regex.raw, replaceWith.value)
                },
                {
                    parameters: ['text', '~regex#50000', 'replaceWith'],
                    description: tag.text.description,
                    exampleCode: tag.text.exampleCode,
                    exampleOut: tag.text.exampleOut,
                    returns: 'string',
                    execute: (_, [text, regex, replaceWith]) => this.regexReplace(text.value, regex.raw, replaceWith.value)
                }
            ]
        });
        this.#converter = converter;
    }

    public setOutputReplacement(context: BBTagScript, regexStr: string, replacement: string): void {
        context.runtime.outputOptions.replace = {
            regex: createRegex(this.#converter, regexStr),
            with: replacement
        };
    }

    public regexReplace(text: string, regexStr: string, replaceWith: string): string {
        const regex = createRegex(this.#converter, regexStr);
        return text.replace(regex, replaceWith);
    }
}
