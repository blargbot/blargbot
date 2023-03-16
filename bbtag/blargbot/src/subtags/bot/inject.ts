import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.inject;

@Subtag.id('inject')
@Subtag.ctorArgs()
export class InjectSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: (context, [code]) => this.inject(context, code.value)
                }
            ]
        });
    }

    public async inject(context: BBTagScript, code: string): Promise<string> {
        return await context.runtime.createScript({
            flags: context.flags,
            inputRaw: context.inputRaw,
            name: context.name,
            source: code,
            cooldownMs: 0
        }).execute();
    }
}
