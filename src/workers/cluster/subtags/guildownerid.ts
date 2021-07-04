import { BaseSubtag, SubtagType } from '../core';

export class GuildOwnerIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'guildownerid',
            category: SubtagType.API,
            desc: 'Returns the id of the guild\'s owner.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The owner\'s id is {guildownerid}.',
                    exampleOut: 'The owner\'s id is 1234567890123456.',
                    execute: (ctx) => ctx.guild.ownerID
                }
            ]
        });
    }
}
