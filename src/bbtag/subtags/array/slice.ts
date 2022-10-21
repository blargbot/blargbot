import { Lazy } from '@blargbot/core/Lazy';
import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotAnArrayError, NotANumberError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.slice;

export class SliceSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'slice',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'start', 'end?:999999999999'],
                    description: 'Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.',
                    exampleCode: '{slice;["this", "is", "an", "array"];1}',
                    exampleOut: '["is","an","array"]',
                    returns: 'json[]',
                    execute: (ctx, [array, start, end]) => this.slice(ctx, array.value, start.value, end.value)
                }
            ]
        });
    }

    public async slice(context: BBTagContext, array: string, startStr: string, endStr: string): Promise<JArray> {
        const arr = await bbtag.tagArray.deserializeOrGetArray(context, array);
        const fallback = new Lazy(() => parse.int(context.scopes.local.fallback ?? ''));

        if (arr === undefined)
            throw new NotAnArrayError(array);

        const start = parse.int(startStr) ?? fallback.value;
        if (start === undefined)
            throw new NotANumberError(startStr);

        const end = parse.int(endStr) ?? fallback.value;
        if (end === undefined)
            throw new NotANumberError(endStr);

        return arr.v.slice(start, end);
    }
}
