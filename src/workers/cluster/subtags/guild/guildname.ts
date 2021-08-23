import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'guildname',
            category: SubtagType.GUILD,
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
