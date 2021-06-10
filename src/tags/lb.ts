import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class LbSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'lb',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by `{` on execution.',
            usage: '{lb}',
            exampleCode: 'This is a bracket! {lb}',
            exampleOut: 'This is a bracket! {',
            definition: [
                {
                    args: [],
                    description: 'Returns `[`',
                    execute: () => '['
                }
            ]
        });
    }
}