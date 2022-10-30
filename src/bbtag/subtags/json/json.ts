import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError } from '../../errors';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.json;

export class JsonSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'json',
            category: SubtagType.JSON,
            aliases: ['j'],
            definition: [
                {
                    parameters: ['~input?:{}'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json',
                    execute: (_, [value]) => this.getJson(value.raw)
                }
            ]
        });
    }

    public getJson(input: string): JToken {
        const result = bbtag.json.parse(input);
        if (result === undefined)
            throw new BBTagRuntimeError('Invalid JSON provided');
        return result;
    }
}
