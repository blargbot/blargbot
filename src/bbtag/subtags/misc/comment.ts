import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.comment;

export class CommentSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'comment',
            aliases: ['//'],
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
