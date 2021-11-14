import { BBTagContext, Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class TagAuthorizerSubtag extends Subtag {
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
        return context.authorizer;
    }
}
