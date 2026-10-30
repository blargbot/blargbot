import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesFeature } from '../types.js';

const tag = templates.subtags.jsonGet;

type Features = VariablesFeature;
export class JsonGetSubtag extends CompiledSubtag {
    readonly #features: Features;
    public constructor(features: Features) {
        super({
            name: 'jsonGet',
            category: SubtagType.JSON,
            aliases: ['jGet'],
            definition: [
                {
                    parameters: ['input:{}#10000000'],
                    description: tag.parse.description,
                    exampleCode: tag.parse.exampleCode,
                    exampleOut: tag.parse.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input]) => this.jsonGet(ctx, input.value, undefined)
                },
                {
                    parameters: ['input:{}#10000000', 'path'],
                    description: tag.path.description,
                    exampleCode: tag.path.exampleCode,
                    exampleOut: tag.path.exampleOut,
                    returns: 'json|nothing',
                    execute: (ctx, [input, path]) => this.jsonGet(ctx, input.value, path.value)
                }
            ]
        });
        this.#features = features;
    }

    public async jsonGet(context: BBTagContext, input: string, path?: string): Promise<JToken | undefined> {
        const variables = this.#features.variables.forContext(context);
        const obj = (await bbtag.json.resolveObj(variables, input)).object;
        if (path === undefined)
            return obj;
        return bbtag.json.get(obj, path);
    }
}
