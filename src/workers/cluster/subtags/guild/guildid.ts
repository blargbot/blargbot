import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class GuildIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'guildid',
            category: SubtagType.GUILD,
            desc: 'Returns the id of the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The guild\'s id is {guildid}',
                    exampleOut: 'The guild\'s id is 1234567890123456',
                    returns: 'id',
                    execute: (ctx) => ctx.guild.id
                }
            ]
        });
    }
}
