import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class ConcatSubtag extends Subtag {
    public constructor() {
        super({
            name: 'concat',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['values+'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'json[]',
                    execute: (_, [...arrays]) => this.concatArrays(arrays.map((arr) => arr.value))
                }
            ]
        });
    }

    public concatArrays(values: string[]): JArray {
        return bbtag.tagArray.flattenArray(values);
    }
}
