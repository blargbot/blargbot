import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { convertToBoolean } from '../../utils/converters.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.filter;

type Features = VariablesFeature;
export class FilterSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
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
        this.#features = features;
    }

    public async * filter(context: BBTagContext, varName: string, source: string, code: SubtagArgument): AsyncIterable<JToken> {
        const variables = this.#features.variables.forContext(context);
        const array = await bbtag.tagArray.deserializeOrGetIterable(variables, source) ?? [];
        try {
            for (const item of array) {
                await context.root.limit.check(context, 'filter:loops');
                await variables.set(varName, item);
                if (convertToBoolean((await code.execute()).trim()) ?? false)
                    yield item;

                if (context.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            variables.reset([varName]);
        }
    }
}
