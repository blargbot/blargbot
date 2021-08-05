import { BaseSubtag } from '@cluster/bbtag';
import { bbtagUtil, SubtagType  } from '@cluster/utils';

export class IsArraySubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'isarray',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Determines whether `text` is a valid array.',
                    exampleCode: '{isarray;["array?"]} {isarray;array?}',
                    exampleOut: 'true false',
                    execute: (_, [{value: inputStr}]) => {
                        const input = bbtagUtil.tagArray.deserialize(inputStr);
                        return (input !== undefined && Array.isArray(input.v)).toString();
                    }
                }
            ]
        });
    }
}
