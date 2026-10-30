import type { SubtagArgument } from '../../arguments/index.js';
import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.map;

type Features = VariablesFeature;
export class MapSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'map',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['variable', 'array#10000000', '~code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (context, [varName, array, code]) => this.map(context, varName.value, array.value, code)
                }
            ]
        });
        this.#features = features;
    }

    public async * map(context: BBTagContext, varName: string, arrayStr: string, code: SubtagArgument): AsyncIterable<string> {
        const variables = this.#features.variables.forContext(context);
        const array = await bbtag.tagArray.deserializeOrGetIterable(variables, arrayStr) ?? [];
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
