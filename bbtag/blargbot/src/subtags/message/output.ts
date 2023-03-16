import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError } from '../../errors/index.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.output;

@Subtag.id('output')
@Subtag.ctorArgs()
export class OutputSubtag extends CompiledSubtag {
    public constructor() {
        super({
            category: SubtagType.MESSAGE,
            definition: [
                {
                    parameters: ['text?'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'id',
                    execute: (ctx, [text]) => this.sendTagOutput(ctx, text.value)
                }
            ]
        });
    }

    public async sendTagOutput(context: BBTagScript, text: string): Promise<string> {
        if (context.runtime.outputOptions.id !== undefined && text.length > 0)
            throw new BBTagRuntimeError('Cannot send multiple outputs');
        return await context.runtime.output(text) ?? '';
    }
}
