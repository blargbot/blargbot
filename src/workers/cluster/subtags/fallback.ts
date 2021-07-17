import { BaseSubtag, SubtagType } from '@cluster/core';

export class FallBackSubtag extends BaseSubtag {
    public constructor() {
        super({
            name: 'fallback',
            category: SubtagType.COMPLEX,
            definition: [
                {
                    parameters: ['message?'],
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleCode: '{fallback;This tag failed} {randint}',
                    exampleOut: 'This tag failed',
                    execute: (ctx, [message]) => { ctx.scope.fallback = message.value; }
                }
            ]
        });
    }
}
