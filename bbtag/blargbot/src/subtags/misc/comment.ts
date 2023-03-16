import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.comment;

@Subtag.id('comment', '//')
@Subtag.ctorArgs()
export class CommentSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MISC,
            definition: [
                {
                    parameters: ['~anything*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: () => this.doNothing()
                }
            ]
        });
    }

    public doNothing(): void {
        /*NOOP*/
    }
}
