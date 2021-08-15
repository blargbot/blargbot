import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';

export class PopSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'pop',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array'],
                    description: 'Returns the last element in `array`. If provided a variable, this will remove the last element from `array`as well.',
                    exampleCode: '{pop;["this", "is", "an", "array"]}',
                    exampleOut: 'array',
                    execute: async (context, [{value: arrStr}], subtag) => {
                        const arr = await bbtagUtil.tagArray.getArray(context, arrStr);

                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);

                        const result = arr.v.pop();
                        if (arr.n !== undefined)
                            await context.variables.set(arr.n, arr.v);
                        return parse.string(result);
                    }
                }
            ]
        });
    }
}
