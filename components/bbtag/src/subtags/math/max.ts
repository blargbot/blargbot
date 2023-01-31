import { hasValue } from '@blargbot/guards';

import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.max;

@Subtag.names('max')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.converter())
export class MaxSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter) {
        super({
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, values) => this.max(values.map(arg => arg.value))
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#converter = converter;
    }

    public max(values: string[]): number {
        const flattenedArgs = this.#arrayTools.flattenArray(values);
        const parsedArgs = flattenedArgs.map(arg => this.#converter.float(arg?.toString() ?? ''));
        const filteredArgs = parsedArgs.filter(hasValue);

        if (filteredArgs.length < parsedArgs.length)
            return NaN;

        return Math.max(...filteredArgs);
    }
}
