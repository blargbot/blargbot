import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.round;

@Subtag.names('round')
@Subtag.ctorArgs(Subtag.converter())
export class RoundSubtag extends CompiledSubtag {
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
                    execute: (_, [number]) => this.round(number.value)
                }
            ]
        });

        this.#converter = converter;
    }

    public round(value: string): number {
        const number = this.#converter.float(value);
        if (number === undefined)
            throw new NotANumberError(value);
        return Math.round(number);
    }
}
