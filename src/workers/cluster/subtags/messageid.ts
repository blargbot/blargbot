import { BaseSubtag, SubtagType } from '../core';

export class MessageIdSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'messageid',
            category: SubtagType.API,
            desc: 'Returns the ID of the invoking message.',
            definition: [
                {
                    parameters: [],
                    exampleCode: 'The message id was {messageid}',
                    exampleOut: 'The message id was 111111111111111111',
                    execute: (ctx) => ctx.message.id
                }
            ]
        });
    }
}
