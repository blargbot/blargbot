import { guard, parse } from '@blargbot/core/utils/index.js';

import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { bbtag, SubtagType } from '../../utils/index.js';

export class MinSubtag extends Subtag {
    public constructor() {
        super({
            name: 'min',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, values) => this.min(values.map(arg => arg.value))
                }
            ]
        });
    }

    public min(args: string[]): number {
        const flattenedArgs = bbtag.tagArray.flattenArray(args);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ''));
        const filteredArgs = parsedArgs.filter(guard.hasValue);

        if (filteredArgs.length < parsedArgs.length)
            return NaN;

        return Math.min(...filteredArgs);
    }
}
