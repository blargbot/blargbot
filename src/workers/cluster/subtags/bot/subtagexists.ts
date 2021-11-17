import { Subtag } from '@cluster/bbtag';
import { Cluster } from '@cluster/Cluster';
import { SubtagType } from '@cluster/utils';

export class SubtagExistsSubtag extends Subtag {
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
                    returns: 'boolean',
                    execute: (_, [subtag]) => this.cluster.subtags.get(subtag.value) !== undefined
                }
            ]
        });
    }
}
