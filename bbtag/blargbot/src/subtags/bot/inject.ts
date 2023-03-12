import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { parseBBTag } from '../../language/parseBBTag.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.inject;

@Subtag.names('inject')
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

    public async inject(context: BBTagContext, code: string): Promise<string> {
        return await context.withStack(async () => {
            const ast = parseBBTag(code);
            const result = await context.eval(ast);
            if (context.data.state === BBTagRuntimeState.RETURN)
                context.data.state = BBTagRuntimeState.RUNNING;
            return result;
        });
    }
}
