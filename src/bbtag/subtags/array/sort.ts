import { compare, parse } from '@blargbot/core';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.sort;

export class SortSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
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
        this.#variables = variables;
    }

    public async sort(context: BBTagContext, arrayStr: string, descendingStr: string): Promise<JArray | undefined> {
        const variables = this.#variables.forContext(context);
        const arr = await bbtag.tagArray.deserializeOrGetArray(variables, arrayStr);
        if (arr === undefined)
            throw new NotAnArrayError(arrayStr);

        const direction = parse.boolean(descendingStr, descendingStr !== '') ? -1 : 1;
        arr.v = arr.v.sort((a, b) => direction * compare(parse.string(a), parse.string(b)));

        if (arr.n === undefined)
            return arr.v;

        await variables.set(arr.n, arr.v);
        return undefined;
    }
}
