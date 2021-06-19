import { Cluster } from '../cluster';
import { BaseSubtag } from '../core/bbtag';
import { SubtagType } from '../utils';

export class GuildNameSubtag extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildname',
            category: SubtagType.API,
            desc: 'Returns the name of the current guild.',
            definition: [
                {
                    args: [],
                    exampleCode: 'This guild\'s name is {guildname}.',
                    exampleOut: 'This guild\'s name is TestGuild.',
                    execute: (ctx) => ctx.guild.name
                }
            ]
        });
    }
}