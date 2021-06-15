import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';
import { AllHtmlEntities as Entities } from 'html-entities';
const entities = new Entities();

export class HtmlDecodeSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'htmlencode',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['text+'],
                    description: 'Encodes `text` with escaped html entities.',
                    exampleCode: '{htmlencode;<hello, world>}',
                    exampleOut: '&lt;hello, world&gt;',
                    execute: (_, args) => entities.encode(args.map(arg => arg.value).join(';'))
                }
            ]
        });
    }
}