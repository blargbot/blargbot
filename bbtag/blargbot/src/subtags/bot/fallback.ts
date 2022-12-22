import { Subtag } from '@bbtag/subtag'
import { p } from '../p.js';

export class FallbackSubtag extends Subtag {
    public constructor() {
        super({
            name: 'fallback',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['message'],
                    description: tag.clear.description,
                    exampleCode: tag.clear.exampleCode,
                    exampleOut: tag.clear.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [message]) => this.setFallback(ctx, message.value)
                },
                {
                    parameters: [],
                    description: tag.set.description,
                    exampleCode: tag.set.exampleCode,
                    exampleOut: tag.set.exampleOut,
                    returns: 'nothing',
                    execute: (ctx) => this.setFallback(ctx, undefined)
                }
            ]
        });
    }

    public setFallback(context: BBTagContext, value: string | undefined): void {
        context.scopes.local.fallback = value;
    }
}
