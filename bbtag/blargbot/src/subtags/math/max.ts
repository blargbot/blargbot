import { guard, parse } from '@blargbot/core/utils/index.js';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { bbtag, SubtagType } from '../../utils/index.js';

export class MaxSubtag extends Subtag {
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
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ''));
        const filteredArgs = parsedArgs.filter(guard.hasValue);

        if (filteredArgs.length < parsedArgs.length)
            return NaN;

        return Math.max(...filteredArgs);
    }
}
