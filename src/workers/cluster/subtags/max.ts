import { Cluster } from '../Cluster';
import { BaseSubtag, bbtagUtil, parse, SubtagType } from '../core';

export class MaxSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'max',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: 'Returns the largest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.',
                    exampleCode: '{max;50;2;65}',
                    exampleOut: '65',
                    execute: (_, args) => this.max(args.map(arg => arg.value))
                }
            ]
        });
    }

    public max(
        args: string[]
    ): string {
        const flattenedArgs = bbtagUtil.tagArray.flattenArray(args);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() ?? ''));

        if (parsedArgs.filter(isNaN).length > 0)
            return 'NaN';

        return Math.max(...parsedArgs).toString();
    }
}