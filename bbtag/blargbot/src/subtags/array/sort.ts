import { NotAnArrayError } from '@bbtag/engine';
import { Subtag } from '@bbtag/subtag';
import { compare, parse } from '@blargbot/core/utils/index.js';

import { bbtag, SubtagType } from '../../utils/index.js';
import { p } from '../p.js';

export class SortSubtag extends Subtag {
    public constructor() {
        super({
            name: 'sort',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'descending?:false'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]|nothing',
                    execute: (ctx, [array, descending]) => this.sort(ctx, array.value, descending.value)
                }
            ]
        });
    }

    public async sort(context: BBTagContext, arrayStr: string, descendingStr: string): Promise<JArray | undefined> {
        const arr = await bbtag.tagArray.deserializeOrGetArray(context, arrayStr);
        if (arr === undefined)
            throw new NotAnArrayError(arrayStr);

        const direction = parse.boolean(descendingStr, descendingStr !== '') ? -1 : 1;
        arr.v = arr.v.sort((a, b) => direction * compare(parse.string(a), parse.string(b)));

        if (arr.n === undefined)
            return arr.v;

        await context.variables.set(arr.n, arr.v);
        return undefined;
    }
}
