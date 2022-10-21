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
                    description: 'Returns the user ID of the tag/cc authorizer',
                    exampleCode: '{username;{tagauthorizer}} authorized this tag!',
                    exampleOut: 'stupid cat authorized this tag!',
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
