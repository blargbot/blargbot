import { guard, parse } from '@blargbot/core/utils/index.js';

import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.max;

export class MaxSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'max',
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
    }

    public max(values: string[]): number {
        const flattenedArgs = bbtag.tagArray.flattenArray(values);
        const parsedArgs = [];
        for (const arg of flattenedArgs) {
            if (!isValidArg(arg))
                return NaN;
            const parsed = parse.float(arg);
            if (parsed === undefined)
                return NaN;
            parsedArgs.push(parsed);
        }

        return Math.max(...parsedArgs);
    }
}

const isValidArg = guard.isTypeOf('string', 'number');
