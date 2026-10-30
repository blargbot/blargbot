import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { convertToNumber } from '../../utils/converters.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.parseFloat;

export class ParseFloatSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'parseFloat',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [number]) => this.parseFloat(number.value)
                }
            ]
        });
    }

    public parseFloat(number: string): number {
        return convertToNumber(number) ?? NaN;
    }
}
