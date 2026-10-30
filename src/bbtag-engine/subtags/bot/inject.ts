import { CompiledSubtag } from '../../compilation/index.js';
import { templates } from '../../text.js';
import { BBTagRuntimeState } from '../../types.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.inject;

export class InjectSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'inject',
            category: SubtagType.BOT,
            definition: [
                {
                    parameters: ['code'],
                    description: tag.default.description,
                    exampleCode: tag.default.exampleCode,
                    exampleOut: tag.default.exampleOut,
                    returns: 'string',
                    execute: async (context, [code]) => {
                        using _stack = context.enterRecursion();
                        const ast = bbtag.parse(code.value, { throw: true });
                        const result = await context.eval(ast);
                        if (context.state === BBTagRuntimeState.RETURN)
                            context.state = BBTagRuntimeState.RUNNING;
                        return result;
                    }
                }
            ]
        });
    }
}
