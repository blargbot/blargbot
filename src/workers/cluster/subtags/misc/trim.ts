import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class TrimSubtag extends Subtag {
    public constructor() {
        super({
            name: 'trim',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Trims whitespace and newlines before and after `text`.',
                    exampleCode: 'Hello {trim;{space;10}beautiful{space;10}} World',
                    exampleOut: 'Hello beautiful World',
                    returns: 'string',
                    execute: (_, [text]) => text.value.trim()
                }
            ]
        });
    }
}
