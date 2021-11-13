import { Subtag } from '@cluster/bbtag';
import { NotAnArrayError } from '@cluster/bbtag/errors';
import { bbtagUtil, shuffle, SubtagType } from '@cluster/utils';

export class ShuffleSubtag extends Subtag {
    public constructor() {
        super({
            name: 'shuffle',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: [],
                    description: 'Shuffles the `{args}` the user provided.',
                    exampleCode: '{shuffle} {args;0} {args;1} {args;2}',
                    exampleIn: 'one two three',
                    exampleOut: 'three one two',
                    execute: (ctx) => shuffle(ctx.input)
                },
                {
                    parameters: ['array'],
                    description: 'Shuffles the `{args}` the user provided, or the elements of `array`. If used with a variable this will modify the original array',
                    exampleCode: '{shuffle;[1,2,3,4,5,6]}',
                    exampleOut: '[5,3,2,6,1,4]',
                    execute: async (context, [array]): Promise<string | void> => {
                        const arr = bbtagUtil.tagArray.deserialize(array.value);
                        if (arr === undefined || !Array.isArray(arr.v))
                            throw new NotAnArrayError(array.value);

                        shuffle(arr.v);
                        if (arr.n === undefined)
                            return bbtagUtil.tagArray.serialize(arr.v);
                        await context.variables.set(arr.n, arr.v);
                    }
                }
            ]
        });
    }
}
