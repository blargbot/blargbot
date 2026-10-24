import { parse } from '@blargbot/core';
import { Lazy } from '@blargbot/util';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { NotAnArrayError, NotANumberError } from '../../errors/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.slice;

export class SliceSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
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
        this.#variables = variables;
    }

    public async slice(context: BBTagContext, array: string, startStr: string, endStr: string): Promise<JArray> {
        const variables = this.#variables.forContext(context);
        const arr = await bbtag.tagArray.deserializeOrGetArray(variables, array);
        const fallback = new Lazy(() => parse.int(context.local.fallback ?? ''));

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
