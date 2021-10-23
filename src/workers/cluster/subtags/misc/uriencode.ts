import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UriEncodeSubtag extends BaseSubtag {
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
                    execute: (_, [{ value: text }]) => encodeURIComponent(text)
                }
            ]
        });
    }
}
