import { DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';
import { encode } from 'html-entities';

export class HtmlEncodeSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'htmlencode',
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Encodes `text` with escaped html entities.',
                    exampleCode: '{htmlencode;<hello, world>}',
                    exampleOut: '&lt;hello, world&gt;',
                    returns: 'string',
                    execute: (_, [text]) => this.htmlEncode(text.value) // TODO: use subtag.source
                }
            ]
        });
    }

    public htmlEncode(html: string): string {
        return encode(html);
    }
}
