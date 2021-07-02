import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';
import { AllHtmlEntities as Entities } from 'html-entities';
const entities = new Entities();

export class HtmlDecodeSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'htmldecode',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text+'],
                    description: 'Decodes html entities from `text`.',
                    exampleCode: '{htmldecode;&lt;hello, world&gt;}',
                    exampleOut: '<hello, world>',
                    execute: (_, args) => entities.decode(args.map(arg => arg.value).join(';'))
                }
            ]
        });
    }
}