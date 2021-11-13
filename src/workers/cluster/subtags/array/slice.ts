import { Subtag } from '@cluster/bbtag';
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
                    execute: async (context, [array, startStr, endStr]) => {
                        const arr = await bbtagUtil.tagArray.getArray(context, array.value);
                        const fallback = new Lazy<number>(() => parse.int(context.scopes.local.fallback ?? ''));

                        if (arr === undefined || !Array.isArray(arr.v))
                            throw new NotAnArrayError(array.value);

                        const start = parse.int(startStr.value, false) ?? fallback.value;
                        if (isNaN(start))
                            throw new NotANumberError(startStr.value);

                        const end = parse.int(endStr.value, false) ?? fallback.value;
                        if (isNaN(end))
                            throw new NotANumberError(endStr.value);

                        return bbtagUtil.tagArray.serialize(arr.v.slice(start, end));
                    }
                }
            ]
        });
    }
}
