import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class GuildSizeSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildsize',
            aliases: ['inguild'],
            category: SubtagType.API,
            desc: 'Returns the number of members on the current guild.',
            definition: [
                {
                    args: [],
                    exampleCode: 'This guild has {guildsize} members.',
                    exampleOut: 'This guild has 123 members.',
                    execute: (ctx) => ctx.guild.memberCount.toString()
                }
            ]
        });
    }
}