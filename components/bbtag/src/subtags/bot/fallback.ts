import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.fallback;

@Subtag.names('fallback')
@Subtag.ctorArgs()
export class FallbackSubtag extends CompiledSubtag {
    public constructor() {
        super({
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
