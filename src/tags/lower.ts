import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class LowerSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'lower',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['text'],
                    description: 'Returns `text` as lowercase.',
                    exampleCode: '{lower;THIS WILL BECOME LOWERCASE}',
                    exampleOut: 'this will become lowercase',
                    execute: (_, [{value: text}]) => text.toLowerCase()
                }
            ]
        });
    }
}