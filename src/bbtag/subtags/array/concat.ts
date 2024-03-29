import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.concat;

export class ConcatSubtag extends CompiledSubtag {
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
