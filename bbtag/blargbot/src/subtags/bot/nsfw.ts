import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.nsfw;

@Subtag.id('nsfw')
@Subtag.ctorArgs()
export class NsfwSubtag extends CompiledSubtag {
    public constructor() {
        super({
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

    public setNsfw(context: BBTagScript, message: string): void {
        context.runtime.outputOptions.nsfwMessage = message;
    }
}
