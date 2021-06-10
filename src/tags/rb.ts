import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class RbSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'rb',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by `}` on execution.',
            usage: '{rb}',
            exampleCode: 'This is a bracket! {rb}',
            exampleOut: 'This is a bracket! }',
            definition: {
                whenArgCount: {
                    '0' : () => '}'
                }
            }
        });
    }
}