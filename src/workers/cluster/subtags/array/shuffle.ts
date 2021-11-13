import { BBTagContext, Subtag } from '@cluster/bbtag';
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
                    returns: 'nothing',
                    execute: (ctx) => shuffle(ctx.input)
                },
                {
                    parameters: ['array'],
                    description: 'Shuffles the `{args}` the user provided, or the elements of `array`. If used with a variable this will modify the original array',
                    exampleCode: '{shuffle;[1,2,3,4,5,6]}',
                    exampleOut: '[5,3,2,6,1,4]',
                    returns: 'json[]|nothing',
                    execute: (ctx, [array]) => this.shuffle(ctx, array.value)
                }
            ]
        });
    }

    public async shuffle(context: BBTagContext, array: string): Promise<JArray | undefined> {
        const arr = bbtagUtil.tagArray.deserialize(array);
        if (arr === undefined || !Array.isArray(arr.v))
            throw new NotAnArrayError(array);

        shuffle(arr.v);
        if (arr.n === undefined)
            return arr.v;

        await context.variables.set(arr.n, arr.v);
        return undefined;
    }
}
