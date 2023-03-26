import { catchErrors } from '@blargbot/catch-decorators';

import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { createRegex } from '../../utils/createRegex.js';
import type { BBTagValueConverter } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.regexSplit;

@Subtag.id('regexSplit')
@Subtag.ctorArgs('converter')
export class RegexSplitSubtag extends CompiledSubtag {
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
                    returns: 'string[]',
                    execute: (_, [text, regex]) => this.regexSplit(text.value, regex.raw)
                }
            ]
        });
        this.#converter = converter;
    }

    @catchErrors.thenThrow(Error, err => new BBTagRuntimeError(err.message))
    public regexSplit(text: string, regexStr: string): string[] {
        const regex = createRegex(this.#converter, regexStr);
        return text.split(regex);
    }
}
