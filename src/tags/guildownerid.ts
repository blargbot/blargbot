import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class GuildOwnerIdSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildownerid',
            category: SubtagType.API,
            desc: 'Returns the id of the guild\'s owner.',
            definition: [
                {
                    args: [],
                    exampleCode: 'The owner\'s id is {guildownerid}.',
                    exampleOut: 'The owner\'s id is 1234567890123456.',
                    execute: (ctx) => ctx.guild.ownerID
                }
            ]
        });
    }
}