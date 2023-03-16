import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.messageId;

@Subtag.id('messageId')
@Subtag.ctorArgs()
export class MessageIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
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

    public getMessageId(context: BBTagScript): string {
        return context.runtime.message.id;
    }
}
