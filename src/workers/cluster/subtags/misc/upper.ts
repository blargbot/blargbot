import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UpperSubtag extends Subtag {
    public constructor() {
        super({
            name: 'upper',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Returns `text` as uppercase.',
                    exampleCode: '{upper;this will become uppercase}',
                    exampleOut: 'THIS WILL BECOME UPPERCASE',
                    returns: 'string',
                    execute: (_, [text]) => text.value.toUpperCase()
                }
            ]
        });
    }
}
