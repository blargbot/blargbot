import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';
import { bbtag, SubtagType } from '../../utils/index.js';

export class JsonValuesSubtag extends Subtag {
    public constructor() {
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
    }

    public async getJsonValue(context: BBTagContext, input: string, path: string): Promise<JToken> {
        const obj = (await bbtag.json.resolveObj(context, input)).object;

        if (path !== '')
            return Object.values(bbtag.json.get(obj, path) ?? {});

        return Object.values(obj);
    }
}
