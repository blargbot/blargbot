import { DefinedSubtag } from '../../DefinedSubtag';
import { bbtag, SubtagType } from '../../utils';

export class LengthSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'length',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['value'],
                    description: 'Gives the amount of characters in `value`, or the number of elements if it is an array.',
                    exampleCode: 'What you said is {length;{args}} chars long.',
                    exampleIn: 'Hello',
                    exampleOut: 'What you said is 5 chars long.',
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
