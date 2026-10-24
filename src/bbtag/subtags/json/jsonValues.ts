import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';
import type { VariablesProvider } from '../../Variables.js';

const tag = templates.subtags.jsonValues;

export class JsonValuesSubtag extends CompiledSubtag {
    readonly #variables: VariablesProvider;
    public constructor({ variables }: { variables: VariablesProvider; }) {
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
        this.#variables = variables;
    }

    public async getJsonValue(context: BBTagContext, input: string, path: string): Promise<JToken> {
        const variables = this.#variables.forContext(context);
        const obj = (await bbtag.json.resolveObj(variables, input)).object;

        if (path !== '')
            return Object.values(bbtag.json.get(obj, path) ?? {}) as JToken;

        return Object.values(obj) as JToken;
    }
}
