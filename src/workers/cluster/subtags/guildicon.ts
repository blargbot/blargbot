import { Cluster } from '../Cluster';
import { BaseSubtag, SubtagType } from '../core';

export class GuildIcon extends BaseSubtag {
    public constructor(
        cluster: Cluster
    ) {
        super(cluster, {
            name: 'guildicon',
            category: SubtagType.API,
            desc: 'Returns the icon of the current guild. If it doesn\'t exist returns nothing.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The guild\'s icon is {guildicon}',
                    exampleOut: 'The guild\'s icon is (icon url)',
                    execute: (ctx) => ctx.guild.iconURL ?? ''
                }
            ]
        });
    }
}