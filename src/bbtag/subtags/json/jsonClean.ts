import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonClean;

type Features = VariablesFeature;
export class JsonCleanSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'jsonClean',
            category: SubtagType.JSON,
            aliases: ['jClean'],
            definition: [
                {
                    parameters: ['input:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (ctx, [input]) => this.cleanJson(ctx, input.value)
                }
            ]
        });
        this.#features = features;
    }

    public async cleanJson(context: BBTagContext, input: string): Promise<JToken> {
        const variables = this.#features.variables.forContext(context);
        const obj = await bbtag.json.resolveObj(variables, input);
        return bbtag.json.clean(obj.object);
    }
}
