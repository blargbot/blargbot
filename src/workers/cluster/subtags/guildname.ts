import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

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
                    parameters: [],
                    exampleCode: 'This guild\'s name is {guildname}.',
                    exampleOut: 'This guild\'s name is TestGuild.',
                    execute: (ctx) => ctx.guild.name
                }
            ]
        });
    }
}
