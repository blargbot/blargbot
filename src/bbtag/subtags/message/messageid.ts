import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.messageid;

export class MessageIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'messageid',
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: [],
                    description: 'Returns the ID of the invoking message.',
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
