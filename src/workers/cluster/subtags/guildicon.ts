import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildIcon extends BaseSubtag {
    public constructor() {
        super({
            name: 'guildicon',
            category: SubtagType.API,
            desc: 'Returns the icon of the current guild. If it doesn\'t exist returns nothing.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The guild\'s icon is {guildicon}',
                    exampleOut: 'The guild\'s icon is (icon url)',
                    execute: (ctx) => ctx.guild.iconURL({ size: 512, format: 'png', dynamic: true }) ?? ''
                }
            ]
        });
    }
}
