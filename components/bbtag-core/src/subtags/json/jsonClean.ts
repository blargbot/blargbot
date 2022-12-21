import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class JsonCleanSubtag extends Subtag {
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
