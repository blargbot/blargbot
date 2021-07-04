import { BaseSubtag, SubtagType } from '../core';

export class GuildIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'guildid',
            category: SubtagType.API,
            desc: 'Returns the id of the current guild.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The guild\'s id is {guildid}',
                    exampleOut: 'The guild\'s id is 1234567890123456',
                    execute: (ctx) => ctx.guild.id
                }
            ]
        });
    }
}
