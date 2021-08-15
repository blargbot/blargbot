import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class LengthSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'length',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['value'],
                    description: 'Gives the amount of characters in `value`, or the number of elements if it is an array.',
                    exampleCode: 'What you said is {length;{args}} chars long.',
                    exampleIn: 'Hello',
                    exampleOut: 'What you said is 5 chars long.',
                    execute: (_, [{ value }]) => {
                        const deserializedArray = bbtagUtil.tagArray.deserialize(value);
                        if (deserializedArray !== undefined && Array.isArray(deserializedArray.v))
                            return deserializedArray.v.length.toString();
                        return value.length.toString();
                    }
                }
            ]
        });
    }
}
