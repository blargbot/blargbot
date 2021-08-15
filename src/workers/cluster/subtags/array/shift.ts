import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class ShiftSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'shift',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: 'Returns the first element in `array`. If used with a variable this will remove the first element from `array` as well.',
                    exampleCode: '{shift;["this", "is", "an", "array"]}',
                    exampleOut: 'this',
                    execute: async (context, args, subtag): Promise<string | void> => {
                        const arr = await bbtagUtil.tagArray.getArray(context, args[0].value);
                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);

                        const result = arr.v.shift();
                        if (arr.n !== undefined)
                            await context.variables.set(arr.n, arr.v);
                        return parse.string(result);
                    }
                }
            ]
        });
    }
}
