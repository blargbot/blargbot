import { Subtag } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class MaxSubtag extends Subtag {
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
        const flattenedArgs = bbtagUtil.tagArray.flattenArray(values);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ''));

        if (parsedArgs.filter(isNaN).length > 0)
            return NaN;

        return Math.max(...parsedArgs);
    }
}
