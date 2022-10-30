import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.nsfw;

export class NsfwSubtag extends CompiledSubtag {
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
