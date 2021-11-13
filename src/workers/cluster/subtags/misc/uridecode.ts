import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class UriDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'uridecode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Decodes `text` from URI format.',
                    exampleCode: '{uridecode;Hello%20world}',
                    exampleOut: 'Hello world!',
                    returns: 'string',
                    execute: (_, [text]) => decodeURIComponent(text.value)
                }
            ]
        });
    }
}
