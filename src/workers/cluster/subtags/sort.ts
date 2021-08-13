import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, compare, parse, SubtagType } from '@cluster/utils';

export class SortSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'sort',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'descending?'],
                    description: 'Sorts the `array` in ascending order. ' +
                        'If `descending` is provided, sorts in descending order. ' +
                        'If provided a variable, will modify the original `array`.',
                    exampleCode: '{sort;[3, 2, 5, 1, 4]}',
                    exampleOut: '[1,2,3,4,5]',
                    execute: async (context, args, subtag): Promise<string | void> => {
                        const arr = await bbtagUtil.tagArray.getArray(context, args[0].value);
                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);
                        let descending = parse.boolean(args[1].value);

                        if (typeof descending !== 'boolean')
                            descending = args[1].value !== '';

                        arr.v = arr.v.sort((a, b) => {
                            return compare(parse.string(a), parse.string(b));
                        });

                        if (descending)
                            arr.v.reverse();

                        if (arr.n === undefined)
                            return bbtagUtil.tagArray.serialize(arr.v);
                        await context.variables.set(arr.n, arr.v);
                    }
                }
            ]
        });
    }
}
