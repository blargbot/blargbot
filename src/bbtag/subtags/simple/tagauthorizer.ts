import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.tagauthorizer;

export class TagAuthorizerSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'tagauthorizer',
            category: SubtagType.SIMPLE,
            aliases: ['ccauthorizer'],
            definition: [
                {
                    parameters: [],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getAuthorizer(ctx)
                }
            ]
        });
    }

    public getAuthorizer(context: BBTagContext): string {
        return context.authorizerId ?? context.guild.id;
    }
}
