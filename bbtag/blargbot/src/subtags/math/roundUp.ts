import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.roundUp;

@Subtag.names('roundUp', 'ceil')
@Subtag.ctorArgs('converter')
export class RoundUpSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.roundup(number.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public roundup(value: string): number {
        const number = this.#converter.float(value);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.ceil(number);
    }
}
