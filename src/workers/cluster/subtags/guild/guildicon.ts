import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildIcon extends Subtag {
    public constructor() {
        super({
            name: 'guildicon',
            category: SubtagType.GUILD,
            desc: 'Returns the icon of the current guild. If it doesn\'t exist returns nothing.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The guild\'s icon is {guildicon}',
                    exampleOut: 'The guild\'s icon is (icon url)',
                    returns: 'string',
                    execute: (ctx) => ctx.guild.iconURL({ size: 512, format: 'png', dynamic: true }) ?? ''
                }
            ]
        });
    }
}
