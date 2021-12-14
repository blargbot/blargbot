import { Subtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType } from '@cluster/utils';

export class IsArraySubtag extends Subtag {
    public constructor() {
        super({
            name: 'isarray',
            category: SubtagType.ARRAY,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Determines whether `text` is a valid array.',
                    exampleCode: '{isarray;["array?"]} {isarray;array?}',
                    exampleOut: 'true false',
                    returns: 'boolean',
                    execute: (_, [array]) => this.isArray(array.value)
                }
            ]
        });
    }

    public isArray(arrayStr: string): boolean {
        const array = bbtagUtil.tagArray.deserialize(arrayStr);
        return array !== undefined;
    }
}