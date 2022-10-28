import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils/index';

const tag = templates.subtags.jsonClean;

export class JsonCleanSubtag extends CompiledSubtag {
    public constructor() {
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
    }

    public async cleanJson(context: BBTagContext, input: string): Promise<JToken> {
        const obj = await bbtag.json.resolveObj(context, input);
        return bbtag.json.clean(obj.object);
    }
}
