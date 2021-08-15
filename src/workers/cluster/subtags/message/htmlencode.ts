import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';
import { AllHtmlEntities as Entities } from 'html-entities';

const entities = new Entities();

export class HtmlDecodeSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'htmlencode',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text+'],
                    description: 'Encodes `text` with escaped html entities.',
                    exampleCode: '{htmlencode;<hello, world>}',
                    exampleOut: '&lt;hello, world&gt;',
                    execute: (_, args) => entities.encode(args.map(arg => arg.value).join(';'))
                }
            ]
        });
    }
}
