import { compare, parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { NotAnArrayError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.sort;

export class SortSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'sort',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['array', 'descending?:false'],
                    description: 'Sorts the `array` in ascending order. If `descending` is provided, sorts in descending order. If provided a variable, will modify the original `array`.',
                    exampleCode: '{sort;[3, 2, 5, 1, 4]}',
                    exampleOut: '[1,2,3,4,5]',
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
