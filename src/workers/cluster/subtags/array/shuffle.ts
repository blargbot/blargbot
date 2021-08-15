import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, shuffle, SubtagType } from '@cluster/utils';

export class ShuffleSubtag extends BaseSubtag {
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
                    exampleCode: '{shuffle} {args;0} {args;1} {args;2}',
                    exampleIn: 'one two three',
                    exampleOut: 'three one two',
                    execute: async (context, args, subtag): Promise<string | void> => {
                        const arr = await bbtagUtil.tagArray.getArray(context, args[0].value);
                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);

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
