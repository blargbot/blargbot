import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ZwsSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'zws',
            category: SubtagType.SIMPLE,
            desc: 'Will be replaced by a single zero width space (unicode 200B)',
            usage: '{zws}',
            exampleCode: '{zws}',
            exampleOut: '\u200B',
            definition: [
                {
                    args: [],
                    description: 'returns a single zero width space (unicode 200B)',
                    execute: () => '\u200B'
                }
            ]
        });
    }
}