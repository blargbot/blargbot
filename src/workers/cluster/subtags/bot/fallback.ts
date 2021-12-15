import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class FallBackSubtag extends DefinedSubtag {
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
                    execute: (ctx, [message]) => this.setFallback(ctx, message.value)
                }
            ]
        });
    }

    public setFallback(context: BBTagContext, value: string): void {
        context.scopes.local.fallback = value;
    }
}
