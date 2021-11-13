import { Subtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class FallBackSubtag extends Subtag {
    public constructor() {
        super({
            name: 'fallback',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['message?'],
                    description: 'Should any tag fail to parse, it will be replaced with `message` instead of an error.',
                    exampleCode: '{fallback;This tag failed} {randint}',
                    exampleOut: 'This tag failed',
                    returns: 'nothing',
                    execute: (ctx, [message]) => { ctx.scopes.local.fallback = message.value; }
                }
            ]
        });
    }
}
