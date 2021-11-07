import { BaseSubtag } from '@cluster/bbtag';
import { NotAnArrayError } from '@cluster/bbtag/errors';
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
                    execute: async (context, args): Promise<string | void> => {
                        const arr = await bbtagUtil.tagArray.getArray(context, args[0].value);
                        if (arr === undefined || !Array.isArray(arr.v))
                            throw new NotAnArrayError(args[0].value);

                        const direction = parse.boolean(args[1].value) ?? args[1].value !== '' ? -1 : 1;
                        arr.v = arr.v.sort((a, b) => direction * compare(parse.string(a), parse.string(b)));

                        if (arr.n === undefined)
                            return bbtagUtil.tagArray.serialize(arr.v);
                        await context.variables.set(arr.n, arr.v);
                    }
                }
            ]
        });
    }
}
