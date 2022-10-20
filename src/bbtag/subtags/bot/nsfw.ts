import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class NsfwSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'nsfw',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['message?:❌ This contains NSFW content! Go to a NSFW channel. ❌'],
                    description: 'Marks the output as being NSFW, and only to be sent in NSFW channels. A requirement for any tag with NSFW content. `message` is the error to show',
                    exampleCode: 'This command is not safe! {nsfw}',
                    exampleOut: 'This command is not safe!',
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
