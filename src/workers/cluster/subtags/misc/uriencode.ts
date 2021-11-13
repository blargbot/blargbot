import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UriEncodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'uriencode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Encodes `text` in URI format. Useful for constructing links.',
                    exampleCode: '{uriencode;Hello world!}',
                    exampleOut: 'Hello%20world!',
                    returns: 'string',
                    execute: (_, [text]) => encodeURIComponent(text.value)
                }
            ]
        });
    }
}
