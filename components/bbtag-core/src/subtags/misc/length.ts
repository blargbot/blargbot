import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { bbtag, SubtagType } from '../../utils/index.js';

export class LengthSubtag extends Subtag {
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
