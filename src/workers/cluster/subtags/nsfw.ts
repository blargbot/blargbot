import { BaseSubtag, SubtagType } from '../core';

export class NsfwSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'nsfw',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['message?:❌ This contains NSFW content! Go to a NSFW channel. ❌'],
                    description: 'Marks the output as being NSFW, and only to be sent in NSFW channels. A requirement for any tag with NSFW content. ' +
                        '`message` is the error to show',
                    exampleCode: 'This command is not safe! {nsfw}',
                    exampleOut: 'This command is not safe!',
                    execute: (context, [{ value: text }]) => context.state.nsfw = text
                }
            ]
        });
    }
}
