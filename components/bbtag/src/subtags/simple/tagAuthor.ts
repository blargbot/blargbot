import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import templates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.tagAuthor;

export class TagAuthorSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'tagAuthor',
            category: SubtagType.SIMPLE,
            aliases: ['customCommandAuthor', 'ccAuthor'],
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

    public getAuthor(context: BBTagContext): string {
        return context.authorId ?? context.guild.id;
    }
}
