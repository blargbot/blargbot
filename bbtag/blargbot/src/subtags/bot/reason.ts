import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.reason;

@Subtag.id('reason')
@Subtag.ctorArgs()
export class ReasonSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['reason?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, [reason]) => this.setReason(ctx, reason.value)
                }
            ]
        });
    }

    public setReason(context: BBTagScript, reason: string): void {
        context.runtime.scopes.local.reason = reason;

    }
}
