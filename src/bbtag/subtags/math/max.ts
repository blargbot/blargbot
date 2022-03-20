import { parse } from '@blargbot/core/utils';

import { DefinedSubtag } from '../../DefinedSubtag';
import { bbtag, SubtagType } from '../../utils';

export class MaxSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'max',
            category: SubtagType.MATH,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: 'Returns the largest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.',
                    exampleCode: '{max;50;2;65}',
                    exampleOut: '65',
                    returns: 'number',
                    execute: (_, values) => this.max(values.map(arg => arg.value))
                }
            ]
        });
    }

    public max(values: string[]): number {
        const flattenedArgs = bbtag.tagArray.flattenArray(values);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ''));

        if (parsedArgs.filter(isNaN).length > 0)
            return NaN;

        return Math.max(...parsedArgs);
    }
}
