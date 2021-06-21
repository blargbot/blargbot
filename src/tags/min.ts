import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType, bbtagUtil, parse} from '../utils';

export class MinSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'min',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['numbers+'],
                    description: 'Returns the smallest entry out of `numbers`. If an array is provided, it will be expanded to its individual values.',
                    exampleCode: '{min;50;2;65}',
                    exampleOut: '2',
                    execute: (_, args) => this.min(args.map(arg => arg.value))
                }
            ]
        });
    }

    public min(
        args: string[]
    ): string {
        const flattenedArgs = bbtagUtil.tagArray.flattenArray(args);
        const parsedArgs = flattenedArgs.map(arg => parse.float(arg?.toString() || ''));

        if (parsedArgs.filter(isNaN).length > 0)
            return 'NaN';

        return Math.min(...parsedArgs).toString();
    }
}