import { Subtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class ConcatSubtag extends Subtag {
    public constructor() {
        super({
            name: 'concat',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['values+'],
                    description:
                        'Takes `values` and joins them together to form a single array. If `values` is an array, it\'s flattened into the resulting array.',
                    exampleCode: 'Two arrays: {concat;["this", "is"];["an", "array"]}\nStrings and an array: {concat;a;b;c;[1, 2, 3]}',
                    exampleOut: 'Two arrays: ["this","is","an","array"]\nStrings and an array: ["a","b","c", 1, 2, 3]',
                    returns: 'json[]',
                    execute: (_, [...arrays]) => this.concatArrays(arrays.map((arr) => arr.value))
                }
            ]
        });
    }

    public concatArrays(values: string[]): JArray {
        return bbtagUtil.tagArray.flattenArray(values);
    }
}