import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, parse, SubtagType } from '@cluster/utils';
import { Lazy } from '@core/Lazy';

export class SliceSubtag extends BaseSubtag {
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
                    execute: async (context, args, subtag) => {
                        const arr = await bbtagUtil.tagArray.getArray(context, args[0].value);
                        const fallback = new Lazy<number>(() => parse.int(context.scope.fallback ?? ''));

                        if (arr === undefined || !Array.isArray(arr.v))
                            return this.notAnArray(context, subtag);

                        const start = parse.int(args[1].value, false) ?? fallback.value;
                        if (isNaN(start))
                            return this.notANumber(context, subtag, `${args[1].value} is not a number`);

                        const end = parse.int(args[2].value, false) ?? fallback.value;
                        if (isNaN(end))
                            return this.notANumber(context, subtag, `${args[2].value} is not a number`);

                        return bbtagUtil.tagArray.serialize(arr.v.slice(start, end));
                    }
                }
            ]
        });
    }
}
