import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonValues;

type Features = VariablesFeature;
export class JsonValuesSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'jsonValues',
            category: SubtagType.JSON,
            aliases: ['jValues'],
            definition: [
                {
                    parameters: ['object:{}#10000000', 'path?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (ctx, [input, path]) => this.getJsonValue(ctx, input.value, path.value)
                }
            ]
        });
        this.#features = features;
    }

    public async getJsonValue(context: BBTagContext, input: string, path: string): Promise<JToken> {
        const variables = this.#features.variables.forContext(context);
        const obj = (await bbtag.json.resolveObj(variables, input)).object;

        if (path !== '')
            return Object.values(bbtag.json.get(obj, path) ?? {}) as JToken;

        return Object.values(obj) as JToken;
    }
}
