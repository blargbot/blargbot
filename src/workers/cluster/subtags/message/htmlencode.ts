import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { encode } from 'html-entities';

export class HtmlDecodeSubtag extends Subtag {
    public constructor() {
        super({
            name: 'htmlencode',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['text+'],
                    description: 'Encodes `text` with escaped html entities.',
                    exampleCode: '{htmlencode;<hello, world>}',
                    exampleOut: '&lt;hello, world&gt;',
                    returns: 'string',
                    execute: (_, text) => encode(text.map(arg => arg.value).join(';')) // TODO: use subtag.source
                }
            ]
        });
    }
}
