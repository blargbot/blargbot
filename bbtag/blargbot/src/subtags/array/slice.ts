import { NotAnArrayError, NotANumberError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { Lazy } from '@blargbot/core/Lazy.js';
import { parse } from '@blargbot/core/utils/index.js';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class SliceSubtag extends Subtag {
    public constructor() {
        super({
            name: 'slice',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'start', 'end?:999999999999'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
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
