import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.messageId;

export class MessageIdSubtag extends CompiledSubtag {
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
