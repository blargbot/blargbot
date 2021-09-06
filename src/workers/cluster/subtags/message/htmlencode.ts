import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { encode } from 'html-entities';

export class HtmlDecodeSubtag extends BaseSubtag {
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
                    execute: (_, args) => encode(args.map(arg => arg.value).join(';'))
                }
            ]
        });
    }
}
