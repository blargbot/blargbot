import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { decode } from 'html-entities';

export class HtmlDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'htmldecode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text+'],
                    description: 'Decodes html entities from `text`.',
                    exampleCode: '{htmldecode;&lt;hello, world&gt;}',
                    exampleOut: '<hello, world>',
                    returns: 'string',
                    execute: (_, text) => decode(text.map(arg => arg.value).join(';'))
                }
            ]
        });
    }
}
