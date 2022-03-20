import { DefinedSubtag } from '../../DefinedSubtag';
import { bbtag, SubtagType } from '../../utils';

export class IsArraySubtag extends DefinedSubtag {
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
        const array = bbtag.tagArray.deserialize(arrayStr);
        return array !== undefined;
    }
}
