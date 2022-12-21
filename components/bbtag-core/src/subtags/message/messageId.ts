import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';

export class MessageIdSubtag extends Subtag {
    public constructor() {
        super({
            name: 'messageId',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getMessageId(ctx)
                }
            ]
        });
    }

    public getMessageId(context: BBTagContext): string {
        return context.message.id;
    }
}
