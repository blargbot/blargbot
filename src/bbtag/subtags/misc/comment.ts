import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

export class CommentSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `comment`,
            aliases: [`//`],
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: [`~anything*`],
                    description: `Does nothing. Your code is simply ignored.`,
                    exampleCode: `This is a sentence. {//;This is a comment.}`,
                    exampleOut: `This is a sentence.`,
                    returns: `nothing`,
                    execute: () => this.doNothing()
                }
            ]
        });
    }

    public doNothing(): void {
        /*NOOP*/
    }
}
