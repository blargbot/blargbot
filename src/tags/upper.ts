import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class UpperSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'upper',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    args: ['text'],
                    description: 'Returns `text` as uppercase.',
                    exampleCode: '{upper;this will become uppercase}',
                    exampleOut: 'THIS WILL BECOME UPPERCASE',
                    execute: (_, [{value: text}]) => text.toUpperCase()
                }
            ]
        });
    }
}