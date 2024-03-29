import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { bbtag, SubtagType } from '../../utils';

const tag = templates.subtags.length;

export class LengthSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'length',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleIn: tag.default.exampleIn,
                    exampleOut: tag.default.exampleOut,
                    returns: 'number',
                    execute: (_, [value]) => this.getLength(value.value)
                }
            ]
        });
    }

    public getLength(value: string): number {
        const deserializedArray = bbtag.tagArray.deserialize(value);
        if (deserializedArray !== undefined)
            return deserializedArray.v.length;
        return value.length;
    }
}
