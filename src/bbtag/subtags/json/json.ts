import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export class JsonSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `json`,
            category: SubtagType.JSON,
            aliases: [`j`],
            definition: [{
                parameters: [`~input?:{}`],
                description: `Defines a raw JSON object. Usage of subtags is disabled in \`input\`, inside \`input\` all brackets are required to match.`,
                exampleCode: `{json;{\n  "key": "value"\n}}`,
                exampleOut: `{\n  "key": "value"\n}`,
                returns: `json`,
                execute: (_, [value]) => this.getJson(value.raw)
            }]
        });
    }

    public getJson(input: string): JToken {
        const result = bbtag.json.parse(input);
        if (result === undefined)
            throw new BBTagRuntimeError(`Invalid JSON provided`);
        return result;
    }
}
