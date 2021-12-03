import { BBTagContext, Subtag } from '@cluster/bbtag';
import { NotAnArrayError, NotANumberError } from '@cluster/bbtag/errors';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SliceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'slice',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'start', 'end?:999999999999'],
                    description: '`end` defaults to the length of the array.\n\n' +
                        'Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.',
                    exampleCode: '{slice;["this", "is", "an", "array"];1}',
                    exampleOut: '["is","an","array"]',
                    returns: 'json[]',
                    execute: (ctx, [array, start, end]) => this.slice(ctx, array.value, start.value, end.value)
                }
            ]
        });
    }

    public async slice(context: BBTagContext, array: string, startStr: string, endStr: string): Promise<JArray> {
        const arr = await bbtagUtil.tagArray.getArray(context, array);
        const fallback = new Lazy<number>(() => parse.int(context.scopes.local.fallback ?? ''));

        if (arr === undefined)
            throw new NotAnArrayError(array);

        const start = parse.int(startStr, false) ?? fallback.value;
        if (isNaN(start))
            throw new NotANumberError(startStr);

        const end = parse.int(endStr, false) ?? fallback.value;
        if (isNaN(end))
            throw new NotANumberError(endStr);

        return arr.v.slice(start, end);
    }
}
