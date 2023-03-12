import { CompiledSubtag } from '../../compilation/index.js';
import { NotANumberError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';
import type { BBTagValueConverter } from '../../utils/valueConverter.js';

const tag = textTemplates.subtags.absolute;

@Subtag.names('absolute', 'abs')
@Subtag.ctorArgs('arrayTools', 'converter')
export class AbsoluteSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['number'],
                    description: tag.value.description,
                    exampleCode: tag.value.exampleCode,
                    exampleOut: tag.value.exampleOut,
                    returns: 'number|number[]',
                    execute: (_, [value]) => this.absSingle(value.value)
                },
                {
                    parameters: ['numbers+2'],
                    description: tag.array.description,
                    exampleCode: tag.array.exampleCode,
                    exampleOut: tag.array.exampleOut,
                    returns: 'number[]',
                    execute: (_, values) => this.absMultiple(values.map(arg => arg.value))
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public absSingle(value: string): number | number[] {
        const result = this.absMultiple([value]);
        if (result.length === 1)
            return result[0];
        return result;
    }

    public absMultiple(values: string[]): number[] {
        return this.#arrayTools.flattenArray(values)
            .map(s => {
                switch (typeof s) {
                    case 'string': {
                        const result = this.#converter.float(s);
                        if (result === undefined)
                            throw new NotANumberError(s);
                        return result;
                    }
                    case 'number':
                    case 'bigint':
                        return s;
                    default:
                        throw new NotANumberError(s);
                }
            })
            .map(Math.abs);
    }

}
