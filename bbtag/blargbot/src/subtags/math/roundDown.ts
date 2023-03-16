import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.roundDown;

@Subtag.id('roundDown', 'floor')
@Subtag.ctorArgs('converter')
export class RoundDownSubtag extends CompiledSubtag {
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
                    execute: (_, [number]) => this.rounddown(number.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public rounddown(value: string): number {
        const number = this.#converter.float(value);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.floor(number);
    }
}
