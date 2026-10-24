import { parse } from '@blargbot/core';

import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.filter;

export class FilterSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
        super({
            name: 'filter',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description({ disabled: bbtag.overrides.filter }),
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]',
                    execute: (ctx, [variable, array, code]) => this.filter(ctx, variable.value, array.value, code)
                }
            ]
        });
        this.#variables = variables;
    }

    public async * filter(context: BBTagContext, varName: string, source: string, code: SubtagArgument): AsyncIterable<JToken> {
        const variables = this.#variables.forContext(context);
        const array = await bbtag.tagArray.deserializeOrGetIterable(variables, source) ?? [];
        try {
            for (const item of array) {
                await context.root.limit.check(context, 'filter:loops');
                await variables.set(varName, item);
                if (parse.boolean((await code.execute()).trim()) === true)
                    yield item;

                if (context.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            variables.reset([varName]);
        }
    }
}
