import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { SubtagType } from '../../utils';

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
        return context.authorizerId;
    }
}
