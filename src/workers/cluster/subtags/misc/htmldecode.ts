import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { decode } from 'html-entities';

export class HtmlDecodeSubtag extends BaseSubtag {
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
                    execute: (_, args) => decode(args.map(arg => arg.value).join(';'))
                }
            ]
        });
    }
}
