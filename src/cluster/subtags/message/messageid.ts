import { BBTagContext, DefinedSubtag } from '@blargbot/cluster/bbtag';
import { SubtagType } from '@blargbot/cluster/utils';

export class MessageIdSubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'messageid',
            category: SubtagType.MESSAGE,
            desc: 'Returns the ID of the invoking message.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The message id was {messageid}',
                    exampleOut: 'The message id was 111111111111111111',
                    returns: 'id',
                    execute: (ctx) => this.getMessageId(ctx)
                }
            ]
        });
    }

    public getMessageId(context: BBTagContext): string {
        return context.message.id;
    }
}
