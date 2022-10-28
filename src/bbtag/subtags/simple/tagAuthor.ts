import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

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
