import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class NsfwSubtag extends Subtag {
    public constructor() {
        super({
            name: 'nsfw',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['message?:❌ This contains NSFW content! Go to a NSFW channel. ❌'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (context, [text]) => this.setNsfw(context, text.value)
                }
            ]
        });
    }

    public setNsfw(context: BBTagContext, message: string): void {
        context.data.nsfw = message;
    }
}
