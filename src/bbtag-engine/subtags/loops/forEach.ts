import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.forEach;

type Features = VariablesFeature;
export class ForEachSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'forEach',
            category: SubtagType.LOOPS,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'loop',
                    execute: (context, [variable, array, code]) => this.foreach(context, variable.value, array.value, code)
                }
            ]
        });
        this.#features = features;
    }
    public async * foreach(
        context: BBTagContext,
        varName: string,
        source: string,
        code: SubtagArgument
    ): AsyncIterable<string> {
        const variables = this.#features.variables.forContext(context);
        const array = await bbtag.tagArray.deserializeOrGetIterable(variables, source) ?? [];
        try {
            for (const item of array) {
                await context.hooks.loop?.(this);
                await variables.set(varName, item);
                yield await code.execute();

                if (context.state !== BBTagRuntimeState.RUNNING)
                    break;
            }
        } finally {
            variables.reset([varName]);
        }
    }
}
