import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonKeys;

type Features = VariablesFeature;
export class JsonKeysSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'jsonKeys',
            category: SubtagType.JSON,
            aliases: ['jKeys'],
            definition: [
                {
                    parameters: ['object:{}#10000000', 'path?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string[]',
                    execute: (ctx, [object, path]) => this.getJsonKeys(ctx, object.value, path.value)
                }
            ]
        });
        this.#features = features;
    }

    public async getJsonKeys(context: BBTagContext, objStr: string, path: string): Promise<string[]> {
        const variables = this.#features.variables.forContext(context);
        const obj = (await bbtag.json.resolveObj(variables, objStr)).object;

        if (path !== '')
            return Object.keys(bbtag.json.get(obj, path) ?? {});

        return Object.keys(obj);
    }
}
