import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType, bbtagUtil } from '../utils';

export class ConcatSubtag extends BaseSubtag {
    public constructor(cluster: Cluster) {
        super(cluster, {
            name: 'concat',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['arrays+'],
                    description:
                        'Takes `arrays` and joins them together to form a single array.',
                    exampleCode: '{concat;["this", "is"];["an", "array"]}',
                    exampleOut: '["this","is","an","array"]',
                    execute: (_, args) => this.concatArrays(args.map((arg) => arg.value))
                }
            ]
        });
    }

    public concatArrays(arrays: string[]): string {
        const parsedArray = arrays.map((array) => JSON.parse(array));
        const flattenedArray = bbtagUtil.tagArray.flattenArray(parsedArray);
        return JSON.stringify(flattenedArray);
    }
}
