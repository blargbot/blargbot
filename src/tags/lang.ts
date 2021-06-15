import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class LangSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'lang',
            category: SubtagType.BOT,
            deprecated: true,
            definition: [
                {
                    args: ['language'],
                    description: 'Specifies which `language` should be used when viewing the raw of this tag',
                    exampleCode: 'This will be displayed with js! {lang;js}.',
                    exampleOut: 'This will be displayed with js!.',
                    execute: () => ''
                }
            ]
        });
    }
}