import { BaseSubtag } from '@cluster/bbtag';
import { Cluster } from '@cluster/Cluster';
import { SubtagType } from '@cluster/utils';

export class SubtagExistsSubtag extends BaseSubtag {
    public constructor(
        public readonly cluster: Cluster
    ) {
        super({
            name: 'subtagexists',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['subtag'],
                    description: 'Checks to see if `subtag` exists.',
                    exampleIn: '{subtagexists;ban} {subtagexists;AllenKey}',
                    exampleOut: 'true false',
                    execute: (_, [{value: subtag}]) => this.cluster.subtags.get(subtag) !== undefined ? 'true' : 'false'
                }
            ]
        });
    }
}
