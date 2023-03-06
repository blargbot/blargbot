import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.realPad;

@Subtag.names('realPad')
@Subtag.ctorArgs('converter')
export class RealPadSubtag extends CompiledSubtag {
    readonly #converter: BBTagValueConverter;

    public constructor(converter: BBTagValueConverter) {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text', 'length'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (_, [text, length]) => this.realPad(text.value, length.value, ' ', 'right')
                },
                {
                    parameters: ['text', 'length', 'filler: ', 'direction?:right'],
                    description: tag.withDirection.description,
                    exampleCode: tag.withDirection.exampleCode,
                    exampleOut: tag.withDirection.exampleOut,
                    returns: 'string',
                    execute: (_, [text, length, filler, direction]) => this.realPad(text.value, length.value, filler.value, direction.value.toLowerCase())
                }
            ]
        });

        this.#converter = converter;
    }

    public realPad(
        text: string,
        lengthStr: string,
        filler: string,
        directionStr: string
    ): string {
        const length = this.#converter.int(lengthStr);
        if (length === undefined)
            throw new NotANumberError(lengthStr);

        if (filler === '')
            filler = ' ';
        if (filler.length !== 1)
            throw new BBTagRuntimeError('Filler must be 1 character');

        if (directionStr !== 'right' && directionStr !== 'left')
            throw new BBTagRuntimeError('Invalid direction', `${directionStr} is invalid`);
        const direction: 'right' | 'left' = directionStr;

        const padAmount = Math.max(0, length - text.length);

        if (direction === 'right')
            return text + filler.repeat(padAmount);
        return filler.repeat(padAmount) + text;
    }
}
