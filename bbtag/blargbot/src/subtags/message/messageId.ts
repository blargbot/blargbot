import { } from '@bbtag/subtag'
import { p } from '../p.js';
import { Subtag } from '@bbtag/subtag';

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
