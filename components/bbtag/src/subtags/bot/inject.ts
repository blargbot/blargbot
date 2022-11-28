import { CompiledSubtag } from '../../compilation';
import templates from '../../text';
import { BBTagRuntimeState } from '../../types';
import { bbtag, SubtagType } from '../../utils';

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
                        return await context.withStack(async () => {
                            const ast = bbtag.parse(code.value, true);
                            const result = await context.engine.eval(ast, context);
                            if (context.data.state === BBTagRuntimeState.RETURN)
                                context.data.state = BBTagRuntimeState.RUNNING;
                            return result;
                        });
                    }
                }
            ]
        });
    }
}
