import type { BBTagCall } from '../../BBTagCall.js';
import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.debug;

@Subtag.id('debug')
@Subtag.ctorArgs()
export class DebugSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['text*'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'nothing',
                    execute: (ctx, text, subtag) => this.addDebug(ctx, text.map(x => x.value).join(' '), subtag)
                }
            ]
        });
    }

    public addDebug(context: BBTagScript, text: string, subtag: BBTagCall): void {
        context.runtime.debug.push({ token: subtag.ast, text });
    }
}
