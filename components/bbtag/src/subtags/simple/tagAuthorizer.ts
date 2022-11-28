import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.tagAuthorizer;

export class TagAuthorizerSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'tagAuthorizer',
            category: SubtagType.SIMPLE,
            aliases: ['customCommandAuthorizer', 'ccAuthorizer'],
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
