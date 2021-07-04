import { BaseSubtag, SubtagType } from '../core';

export class CommandNameSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'commandname',
            category: SubtagType.BOT,
            desc: 'Gets the name of the current tag or custom command.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'This command is {commandname}',
                    exampleIn: 'b!cc test',
                    exampleOut: 'This command is test',
                    execute: (ctx) => ctx.tagName
                }
            ]
        });
    }
}
