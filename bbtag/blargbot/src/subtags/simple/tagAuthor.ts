import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.tagAuthor;

@Subtag.id('tagAuthor', 'customCommandAuthor', 'ccAuthor')
@Subtag.ctorArgs()
export class TagAuthorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.SIMPLE,
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getAuthor(ctx)
                }
            ]
        });
    }

    public getAuthor(context: BBTagScript): string {
        return context.runtime.authorId ?? context.runtime.guild.id;
    }
}
