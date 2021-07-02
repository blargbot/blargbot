import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class LowerSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'lower',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['text'],
                    description: 'Returns `text` as lowercase.',
                    exampleCode: '{lower;THIS WILL BECOME LOWERCASE}',
                    exampleOut: 'this will become lowercase',
                    execute: (_, [{ value: text }]) => text.toLowerCase()
                }
            ]
        });
    }
}