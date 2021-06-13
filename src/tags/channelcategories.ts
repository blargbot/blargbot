import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class ChannelCategoriesSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'channelcategories',
            category: SubtagType.API,
            desc: 'Returns an array of category IDs on the current guild.',
            definition: [
                {
                    args: [],
                    exampleCode: 'This guild has {length;{categories}} categories.',
                    exampleOut: 'This guild has 7 categories.',
                    execute: (ctx) => JSON.stringify(ctx.guild.channels.filter(c => c.type == 4).map(c => c.id))
                }
            ]
        });
    }
}