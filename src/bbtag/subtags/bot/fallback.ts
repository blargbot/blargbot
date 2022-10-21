import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.fallback;

export class FallBackSubtag extends CompiledSubtag {
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
